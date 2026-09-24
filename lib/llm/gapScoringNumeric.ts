import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GapCandidate, NumericGapScore } from "@/types";

const MODEL = "gemini-3.6-flash";

/**
 * Pass 1: Estimates numeric D/C/S/F for a batch of candidate content gaps via a single LLM call.
 *
 * What it DOES:
 * - Accepts up to MAX_RATIONALE_BATCH_SIZE (60) candidate pairs.
 * - Sends topic pair names, page occurrence count, and combined word count for each topic.
 * - Makes exactly ONE Gemini API call returning strictly numeric D, C, S, F scores (0-10 scale).
 * - Implements retry logic on transient failures and gracefully falls back to empty array on fatal error/malformed JSON.
 * - Does NOT request or return prose justifications or T (which defaults to 0).
 *
 * What it DOES NOT DO:
 * - Does not compute G or G_amplified (that is scoring.ts).
 * - Does not make multiple LLM calls.
 * - Does not invent fake search volume or backlink numbers.
 */
export async function batchGapScoringNumeric(
  candidates: GapCandidate[],
  contextSummary: string,
  customApiKey?: string
): Promise<NumericGapScore[]> {
  if (candidates.length === 0) return [];

  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[gapScoringNumeric] No Gemini API key provided (neither via request nor GEMINI_API_KEY env). Returning empty scores.");
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const pairsText = candidates
    .map(
      (c, i) =>
        `${i + 1}. "${c.topicA}" (found across ${c.pageFreqA} page(s), ~${c.wordCountA.toLocaleString()} total words) <-> "${c.topicB}" (found across ${c.pageFreqB} page(s), ~${c.wordCountB.toLocaleString()} total words)`
    )
    .join("\n");

  const prompt = `You are a GEO (Generative Engine Optimization) content strategy analyst scoring content gap opportunities for a website.

Context about the scanned pages:
${contextSummary}

For each topic pair below, the two topics appear on DIFFERENT pages of the site but NEVER co-occur on the SAME page. Each topic listing includes the number of pages it appears on and the combined word count across those pages.

Score each gap on these four factors (0-10 numeric scale, F must be at least 1):
- D (Topical Depth, 0-10): How substantive is the broader ecosystem opportunity for this combined topic, taking into account how deeply the site already covers each half?
- C (Predicted Connectivity, 0-10): How likely is a definitive article bridging these two topics to attract external links, citations, or references?
- S (Search Volume Proxy, 0-10): How much searcher intent or industry demand exists for this combined topic?
- F (Creation Friction, 1-10): Estimated research/writing effort required to create an authoritative bridge piece. Higher = harder (min 1).

Topic pairs to score:
${pairsText}

Return ONLY a compact JSON array of objects with strictly numeric scores:
[
  {"topicA": "string", "topicB": "string", "D": 8, "C": 7, "S": 8, "F": 5}
]

Rules:
- Return ONLY valid JSON (a plain array, no markdown code fences, no prose or commentary)
- Include exactly all requested pairs in the same order
- All D, C, S, F values must be numbers between 0 and 10 (F >= 1)`;

  let rawText = "";
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const result = await model.generateContent(prompt);
      rawText = result.response.text().trim();
      break;
    } catch (err: unknown) {
      if (attempts >= maxAttempts) {
        console.warn(`[gapScoringNumeric] All ${maxAttempts} attempts failed: ${(err as Error).message}. Returning empty scores.`);
        return [];
      }
      const delayMs = attempts * 500;
      console.warn(`[gapScoringNumeric] Attempt ${attempts} failed (${(err as Error).message}). Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Strip code fences if present
  const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let scores: NumericGapScore[] = [];
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      scores = parsed.filter(
        (s) =>
          typeof s.topicA === "string" &&
          typeof s.topicB === "string" &&
          typeof s.D === "number" &&
          typeof s.C === "number" &&
          typeof s.S === "number" &&
          typeof s.F === "number" &&
          s.F >= 1
      ) as NumericGapScore[];
    }
  } catch {
    console.warn(
      "[gapScoringNumeric] Failed to parse numeric scoring response. Raw:",
      rawText.slice(0, 300)
    );
  }

  return scores;
}
