import { describe, it, expect } from "vitest";
import { generateMarkdownReport } from "@/lib/exportMarkdown";
import type { ScanResultPayload, GapReport } from "@/types";

describe("Milestone 5: Markdown Report Export", () => {
  const sampleResults: ScanResultPayload[] = [
    {
      success: true,
      url: "https://trustnodelogic.com/page1",
      extracted: {
        url: "https://trustnodelogic.com/page1",
        canonicalUrl: "https://trustnodelogic.com/page1",
        title: "Test Page One",
        metaDescription: "A comprehensive guide to hybrid music production testing standards.",
        ogDescription: "A comprehensive guide to hybrid music production testing standards.",
        twitterDescription: "A comprehensive guide to hybrid music production testing standards.",
        headings: [{ level: 1, text: "Main Title" }],
        bodyText: "Sample text with hybrid music standards and citations according to research.",
        wordCount: 500,
        paragraphs: ["Sample text paragraph."],
        jsonLd: [{ "@type": "Article", name: "Test" }],
        outboundLinks: [{ href: "https://example.gov", text: "Gov Source", domain: "example.gov" }],
      },
      scorecard: {
        url: "https://trustnodelogic.com/page1",
        timestamp: new Date().toISOString(),
        tactics: {
          citeSources: {
            passed: true,
            totalOutboundCount: 1,
            highAuthorityCount: 1,
            thirdPartyCount: 0,
            inTextCitationCount: 1,
            findings: [{ type: "high_authority_link", source: "example.gov", context: "sample" }],
            summary: "1 high-authority citation found.",
          },
          quotations: {
            passed: false,
            count: 0,
            findings: [],
            summary: "0 quotes detected.",
          },
          statistics: {
            passed: true,
            count: 1,
            findings: [{ category: "percentage", value: "85%", context: "85% of producers" }],
            summary: "1 statistic found.",
          },
          keywordStuffing: {
            passed: true,
            isStuffed: false,
            thresholdPercent: 3.0,
            flaggedKeywords: [],
            topKeywords: [{ term: "hybrid", count: 5, densityPercent: 1.0 }],
            summary: "Clean keyword density.",
          },
        },
        structural: {
          schemaValidation: {
            passed: true,
            totalBlocks: 1,
            validBlocks: 1,
            hasParseErrors: false,
            typesFound: ["Article"],
            sameAsUrls: [],
            reports: [],
            errors: [],
            summary: "Valid JSON-LD schema found.",
          },
          metaDescription: {
            passed: true,
            charCount: 68,
            inOptimalRange: false,
            lengthStatus: "too_short",
            isConsistent: true,
            metaDesc: "Sample meta",
            ogDesc: "Sample meta",
            twitterDesc: "Sample meta",
            summary: "Meta description present.",
          },
          abstractAndFlow: {
            semanticAbstract: {
              passed: true,
              openingWordCount: 100,
              detectedTopicOrEntity: "hybrid",
              containsEntity: true,
              summary: "Semantic opening paragraph detected.",
            },
            zoneDistribution: {
              introZoneCount: 1,
              bodyZoneCount: 3,
              conclusionZoneCount: 1,
              summary: "Entity mentions: 1 in intro (15%), 3 in body (70%), 1 in outro (15%).",
            },
            logicalChain: {
              transitionCount: 2,
              transitionsFound: ["therefore"],
              summary: "2 transition phrases found.",
            },
          },
        },
      },
    },
  ];

  const sampleGapReport: GapReport = {
    recurringTopics: [
      { topic: "hps-1.0", type: "technology", pageCount: 2, pageUrls: ["https://example.com/p1", "https://example.com/p2"] },
      { topic: "suno", type: "technology", pageCount: 2, pageUrls: ["https://example.com/p3", "https://example.com/p4"] },
    ],
    totalCandidatesFound: 1,
    candidatesSentToLLM: 1,
    candidatesExcluded: 0,
    scoredGaps: [
      {
        topicA: "hps-1.0",
        topicB: "suno",
        D: 8,
        C: 8,
        S: 9,
        F: 4,
        T: 2.0,
        G: 36,
        G_amplified: 108,
        rationale: {
          D: "Substantive technical depth bridging HPS and Suno.",
          C: "High backlink potential across music tech communities.",
          S: "Strong query volume.",
          F: "Moderate friction.",
          T: "Time urgency factor T=2.0 applied",
        },
        pagesA: ["https://example.com/p1", "https://example.com/p2"],
        pagesB: ["https://example.com/p3", "https://example.com/p4"],
      },
    ],
    topGaps: [
      {
        topicA: "hps-1.0",
        topicB: "suno",
        D: 8,
        C: 8,
        S: 9,
        F: 4,
        T: 2.0,
        G: 36,
        G_amplified: 108,
        rationale: {
          D: "Substantive technical depth bridging HPS and Suno.",
          C: "High backlink potential across music tech communities.",
          S: "Strong query volume.",
          F: "Moderate friction.",
          T: "Time urgency factor T=2.0 applied",
        },
        pagesA: ["https://example.com/p1", "https://example.com/p2"],
        pagesB: ["https://example.com/p3", "https://example.com/p4"],
      },
    ],
  };

  it("generates formatted markdown report with executive summary, gap prioritization table, and page scorecards", () => {
    const md = generateMarkdownReport(sampleResults, sampleGapReport);

    expect(md).toContain("# GEO Content & Topical Gap Analysis Report");
    expect(md).toContain("## 1. Executive Summary");
    expect(md).toContain("## 2. Topical Gap Prioritization Report");
    expect(md).toContain("| **hps-1.0** ↔ **suno** | **36.0** | **108.0** |");
    expect(md).toContain("Substantive technical depth bridging HPS and Suno.");
    expect(md).toContain("## 3. Individual Page Scorecards");
    expect(md).toContain("Test Page One");
    expect(md).toContain("- **Cite Sources:** ✅ PASS");
    expect(md).toContain("- **Quotation Addition:** ❌ FAIL");
  });

  it("handles single-page scans with no gap report gracefully", () => {
    const md = generateMarkdownReport(sampleResults, null);

    expect(md).toContain("# GEO Content & Topical Gap Analysis Report");
    expect(md).toContain("Single-page scorecard analysis");
    expect(md).not.toContain("## 2. Topical Gap Prioritization Report");
    expect(md).toContain("Test Page One");
  });
});
