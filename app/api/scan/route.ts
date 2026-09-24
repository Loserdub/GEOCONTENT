import { NextRequest, NextResponse } from "next/server";
import { fetchAndExtract } from "@/lib/fetch";
import { analyzePage } from "@/lib/detectors";
import { extractPageTopicsAlgorithmic } from "@/lib/extractors/topicExtraction";
import { batchGapScoringNumeric } from "@/lib/llm/gapScoringNumeric";
import { batchGapJustifications } from "@/lib/llm/gapJustification";
import {
  identifyGapCandidates,
  scoreGaps,
  attachJustifications,
  assembleGapReport,
  MAX_REPORT_GAPS,
} from "@/lib/gapMapping";
import type { ScanResultPayload, GapReport, PageTopicMap, ExtractedContent } from "@/types";

export const maxDuration = 90; // Allow sufficient time for multi-page fetch and LLM calls

const FETCH_CONCURRENCY = 3;

/**
 * Executes async tasks over an array of items with capped concurrency,
 * returning the results in the original input order.
 */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let urls: string[] = [];

    if (Array.isArray(body.urls)) {
      urls = body.urls;
    } else if (typeof body.url === "string") {
      urls = [body.url];
    } else if (typeof body.urls === "string") {
      urls = body.urls
        .split(/[\n,]+/)
        .map((u: string) => u.trim())
        .filter((u: string) => u.length > 0);
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one valid URL to scan." },
        { status: 400 }
      );
    }

    // Enforce 10 URLs cap per scan
    if (urls.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 URLs allowed per scan request." },
        { status: 400 }
      );
    }

    // Parse customAuthorityDomains
    let customAuthorityDomains: string[] | undefined = undefined;
    if (Array.isArray(body.customAuthorityDomains)) {
      customAuthorityDomains = body.customAuthorityDomains
        .map((d: unknown) => String(d).trim())
        .filter((d: string) => d.length > 0);
    } else if (typeof body.customAuthorityDomains === "string") {
      customAuthorityDomains = body.customAuthorityDomains
        .split(/[\n,]+/)
        .map((d: string) => d.trim())
        .filter((d: string) => d.length > 0);
    }

    // Parse optional manualTMap
    const manualTMap = new Map<string, number>();
    if (body.manualTMap && typeof body.manualTMap === "object") {
      for (const [k, v] of Object.entries(body.manualTMap)) {
        if (typeof v === "number") {
          manualTMap.set(k.toLowerCase().trim(), v);
        }
      }
    }

    // Extract optional user-provided Gemini API key (BYOK from UI or header)
    const bodyApiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
    const headerApiKey = request.headers.get("x-gemini-api-key")?.trim() || undefined;
    const customApiKey = bodyApiKey || headerApiKey || undefined;

    // Step 1: Fetch and analyze single-page scorecards with concurrency-capped parallel requests
    interface ProcessedPage {
      itemResult: ScanResultPayload;
      extractedData: ExtractedContent | null;
      wordCount: number;
      url: string;
    }

    const processedPages = await mapConcurrent<string, ProcessedPage>(
      urls,
      FETCH_CONCURRENCY,
      async (rawUrl) => {
        const url = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
          ? rawUrl
          : `https://${rawUrl}`;

        try {
          const fetchResult = await fetchAndExtract(url);

          if (fetchResult.success && fetchResult.data) {
            const scorecard = analyzePage(fetchResult.data, {
              customAuthorityDomains,
            });
            return {
              itemResult: {
                success: true,
                url,
                statusCode: fetchResult.statusCode,
                extracted: fetchResult.data,
                scorecard,
              },
              extractedData: fetchResult.data,
              wordCount: fetchResult.data.wordCount,
              url,
            };
          } else {
            return {
              itemResult: {
                success: false,
                url,
                statusCode: fetchResult.statusCode,
                error: fetchResult.error || "Failed to fetch or extract content from URL.",
              },
              extractedData: null,
              wordCount: 0,
              url,
            };
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          return {
            itemResult: {
              success: false,
              url,
              error: errorMsg || "Failed to fetch or extract content from URL.",
            },
            extractedData: null,
            wordCount: 0,
            url,
          };
        }
      }
    );

    const results: ScanResultPayload[] = [];
    const extractedPages: ExtractedContent[] = [];
    const pageWordCounts = new Map<string, number>();

    for (const page of processedPages) {
      results.push(page.itemResult);
      if (page.extractedData) {
        extractedPages.push(page.extractedData);
        pageWordCounts.set(page.url, page.wordCount);
      }
    }

    // Step 2: Multi-Page Topic Mapping & Gap Analysis (only if 2+ successful pages)
    let gapReport: GapReport | null = null;

    if (extractedPages.length >= 2) {
      // 1. Algorithmic topic extraction (0 LLM calls)
      const pageMaps: PageTopicMap[] = extractedPages.map((page) =>
        extractPageTopicsAlgorithmic(page)
      );

      // 2. Identify candidate gaps and recurring topics
      const {
        candidates,
        recurringTopics,
        totalCandidatesFound,
        candidatesSentToLLM,
        candidatesExcluded,
      } = identifyGapCandidates(pageMaps, pageWordCounts);

      if (candidates.length > 0) {
        const contextSummary = pageMaps
          .map((p) => `- ${p.url}: "${p.title}" (${p.topics.map((t) => t.name).join(", ")})`)
          .join("\n");

        // Pass 1: Batched numeric scoring via Gemini (1 LLM call)
        const numericScores = await batchGapScoringNumeric(candidates, contextSummary, customApiKey);

        // Calculate G and G_amplified using pure gapScore() from scoring.ts
        const scoredGaps = scoreGaps(candidates, numericScores, manualTMap);

        // Pass 2: Batched prose justifications for top N gaps via Gemini (1 LLM call)
        const topGapsSlice = scoredGaps.slice(0, MAX_REPORT_GAPS);
        const justifications = await batchGapJustifications(topGapsSlice, contextSummary, customApiKey);
        const topGapsWithJustifications = attachJustifications(topGapsSlice, justifications);

        // Assemble full GapReport
        gapReport = assembleGapReport(
          scoredGaps,
          topGapsWithJustifications,
          totalCandidatesFound,
          candidatesSentToLLM,
          candidatesExcluded,
          recurringTopics
        );
      } else {
        // No candidate gaps found (all recurring topic pairs co-occur or <= 1 recurring topic)
        gapReport = {
          recurringTopics,
          totalCandidatesFound: 0,
          candidatesSentToLLM: 0,
          candidatesExcluded: 0,
          scoredGaps: [],
          topGaps: [],
        };
      }
    }

    return NextResponse.json({
      success: true,
      scannedCount: results.length,
      successfulCount: extractedPages.length,
      results,
      gapReport,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[/api/scan] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
