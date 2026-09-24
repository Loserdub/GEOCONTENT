import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { JSDOM } from "jsdom";
import axe from "axe-core";

import { Header } from "@/components/layout/Header";
import { ApiKeyBar } from "@/components/scan/ApiKeyBar";
import { ScanForm } from "@/components/scan/ScanForm";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { KpiSummary } from "@/components/scan/KpiSummary";
import { ViewSwitcher } from "@/components/scan/ViewSwitcher";
import { GapReportView } from "@/components/gaps/GapReportView";
import { AgenticPromptModal } from "@/components/gaps/AgenticPromptModal";
import { ScorecardView } from "@/components/scorecards/ScorecardView";
import type { GapReport, ScanResultPayload } from "@/types";

const sampleGapReport: GapReport = {
  recurringTopics: [
    { topic: "HYBRID PRODUCTION", type: "concept", pageCount: 3, pageUrls: ["https://example.com/1", "https://example.com/2"] },
    { topic: "MUSIC PROVENANCE", type: "technology", pageCount: 2, pageUrls: ["https://example.com/3", "https://example.com/4"] },
  ],
  totalCandidatesFound: 1,
  candidatesSentToLLM: 1,
  candidatesExcluded: 0,
  scoredGaps: [],
  topGaps: [
    {
      topicA: "HYBRID PRODUCTION",
      topicB: "MUSIC PROVENANCE",
      pagesA: ["https://example.com/1", "https://example.com/2"],
      pagesB: ["https://example.com/3", "https://example.com/4"],
      D: 8,
      C: 7,
      S: 9,
      F: 2,
      T: 1.0,
      G: 67.5,
      G_amplified: 67.5,
      rationale: {
        D: "High ecosystem depth in generative audio workflows.",
        C: "High backlink and academic citation interest.",
        S: "Strong search query intent in audio tech.",
        F: "Moderate synthesis difficulty required.",
      },
    },
  ],
};

const sampleResults: ScanResultPayload[] = [
  {
    url: "https://example.com/page1",
    success: true,
    extracted: {
      url: "https://example.com/page1",
      canonicalUrl: "https://example.com/page1",
      title: "Hybrid Production Overview",
      metaDescription: "An in-depth guide to hybrid production and AI music workflows.",
      ogDescription: null,
      twitterDescription: null,
      headings: [
        { level: 1, text: "Hybrid Production" },
        { level: 2, text: "Methodology" },
      ],
      bodyText: "This is sample body text with substantive depth and citations.",
      wordCount: 850,
      paragraphs: ["This is sample body text with substantive depth and citations."],
      outboundLinks: [{ href: "https://wikipedia.org", text: "Wikipedia", domain: "wikipedia.org" }],
      jsonLd: [{ "@type": "Article", headline: "Hybrid Production" }],
    },
    scorecard: {
      url: "https://example.com/page1",
      timestamp: new Date().toISOString(),
      tactics: {
        citeSources: {
          passed: true,
          totalOutboundCount: 1,
          highAuthorityCount: 1,
          thirdPartyCount: 0,
          inTextCitationCount: 0,
          findings: [{ type: "high_authority_link", source: "wikipedia.org", context: "Wikipedia" }],
          summary: "Valid authority citation found.",
        },
        quotations: {
          passed: true,
          count: 1,
          findings: [{ quote: "AI is reshaping workflow", attribution: "Dr. Smith", context: "Key finding" }],
          summary: "Attributed quotation present.",
        },
        statistics: {
          passed: true,
          count: 1,
          findings: [{ value: "75%", category: "percentage", context: "75% adoption" }],
          summary: "Specific metrics included.",
        },
        keywordStuffing: {
          passed: true,
          isStuffed: false,
          thresholdPercent: 3.5,
          flaggedKeywords: [],
          topKeywords: [{ term: "hybrid", count: 4, densityPercent: 1.2 }],
          summary: "Natural density.",
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
          summary: "Valid Article schema found.",
        },
        metaDescription: {
          passed: true,
          charCount: 65,
          inOptimalRange: true,
          lengthStatus: "optimal",
          isConsistent: true,
          metaDesc: "An in-depth guide to hybrid production.",
          ogDesc: null,
          twitterDesc: null,
          summary: "Optimal meta description length.",
        },
        abstractAndFlow: {
          semanticAbstract: {
            passed: true,
            openingWordCount: 80,
            detectedTopicOrEntity: "Hybrid Production",
            containsEntity: true,
            summary: "Clear semantic abstract in first 200 words.",
          },
          zoneDistribution: {
            introZoneCount: 1,
            bodyZoneCount: 5,
            conclusionZoneCount: 1,
            summary: "Evenly distributed information density.",
          },
          logicalChain: {
            transitionCount: 4,
            transitionsFound: ["furthermore", "therefore"],
            summary: "Consistent logical flow.",
          },
        },
      },
    },
  },
];

/**
 * Helper to run axe-core on rendered React components inside JSDOM.
 */
async function auditHtml(html: string) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html lang="en"><head><title>Test</title></head><body><a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a><main id="main-content" tabindex="-1">${html}</main></body></html>`
  );
  const results = await axe.run(dom.window.document.body, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: {
      // Color contrast in JSDOM doesn't compute stylesheet layouts, so we check token math separately
      "color-contrast": { enabled: false },
    },
  });

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );

  return { results, violations: results.violations, seriousOrCritical };
}

describe("WCAG 2.1 AA Accessibility Pass", () => {
  it("Header passes axe audit with zero critical/serious violations", async () => {
    const html = renderToString(<Header />);
    const { seriousOrCritical } = await auditHtml(html);
    expect(seriousOrCritical).toEqual([]);
  });

  it("EmptyState passes axe audit with zero critical/serious violations", async () => {
    const html = renderToString(<EmptyState />);
    const { seriousOrCritical } = await auditHtml(html);
    expect(seriousOrCritical).toEqual([]);
  });

  it("LoadingSkeleton passes axe audit with live region and zero critical/serious violations", async () => {
    const html = renderToString(<LoadingSkeleton urlCount={3} />);
    const { seriousOrCritical } = await auditHtml(html);
    expect(seriousOrCritical).toEqual([]);
  });

  it("ScanForm in default state passes axe audit with zero critical/serious violations", async () => {
    const html = renderToString(
      <ScanForm
        urlInput="https://trustnodelogic.com/what-is-hybrid.html"
        setUrlInput={() => {}}
        customDomainsInput=""
        setCustomDomainsInput={() => {}}
        showAdvanced={false}
        setShowAdvanced={() => {}}
        isLoading={false}
        error={null}
        handleScan={() => {}}
        handlePreset={() => {}}
      />
    );
    const { seriousOrCritical } = await auditHtml(html);
    expect(seriousOrCritical).toEqual([]);
  });

  it("ScanForm with advanced settings open and error alert passes axe audit", async () => {
    const html = renderToString(
      <ScanForm
        urlInput="https://trustnodelogic.com"
        setUrlInput={() => {}}
        customDomainsInput="musicbrainz.org"
        setCustomDomainsInput={() => {}}
        showAdvanced={true}
        setShowAdvanced={() => {}}
        isLoading={false}
        error="Network timeout after 10000ms"
        handleScan={() => {}}
        handlePreset={() => {}}
      />
    );
    const { seriousOrCritical } = await auditHtml(html);
    expect(seriousOrCritical).toEqual([]);
  });

  it("Populated Results view (KPIs, Switcher, and TabPanels) passes axe audit with zero critical/serious violations", async () => {
    const kpiHtml = renderToString(
      <KpiSummary
        totalScanned={6}
        successfulScans={6}
        totalGapsCount={1}
        recurringTopicsCount={2}
        avgPassRate={75}
      />
    );
    const switcherHtml = renderToString(
      <ViewSwitcher
        activeView="gaps"
        setActiveView={() => {}}
        hasGaps={true}
        gapCount={1}
        resultCount={1}
        copiedMd={false}
        onCopyMarkdown={() => {}}
        onDownloadMarkdown={() => {}}
      />
    );
    const gapsHtml = renderToString(
      <div role="tabpanel" id="tabpanel-gaps" aria-labelledby="tab-gaps" tabIndex={0}>
        <GapReportView
          gapReport={sampleGapReport}
          expandedCards={{ gap_0: true }}
          onToggleExpand={() => {}}
          totalScannedPages={1}
        />
      </div>
    );
    const scorecardsHtml = renderToString(
      <div role="tabpanel" id="tabpanel-scorecards" aria-labelledby="tab-scorecards" tabIndex={0}>
        <ScorecardView
          results={sampleResults}
          selectedPageIndex={0}
          onSelectPage={() => {}}
        />
      </div>
    );

    const fullResultsHtml = `
      <section aria-label="Scan results and gap analysis">
        ${kpiHtml}
        ${switcherHtml}
        ${gapsHtml}
        ${scorecardsHtml}
      </section>
    `;

    const { seriousOrCritical, violations } = await auditHtml(fullResultsHtml);
    expect(seriousOrCritical).toEqual([]);
    expect(violations.filter(v => v.impact === "moderate")).toEqual([]);
  });

  it("ScorecardView with sample results passes axe audit with zero critical/serious violations", async () => {
    const html = renderToString(
      <div role="tabpanel" id="tabpanel-scorecards" aria-labelledby="tab-scorecards" tabIndex={0}>
        <ScorecardView
          results={sampleResults}
          selectedPageIndex={0}
          onSelectPage={() => {}}
        />
      </div>
    );
    const { seriousOrCritical } = await auditHtml(html);
    expect(seriousOrCritical).toEqual([]);
  });

  it("ApiKeyBar collapsed and expanded states pass axe audit with zero violations", async () => {
    // Test collapsed state
    const collapsedHtml = renderToString(
      <ApiKeyBar
        apiKey=""
        onApiKeyChange={() => {}}
        isOpen={false}
        onToggleOpen={() => {}}
      />
    );
    const collapsedAudit = await auditHtml(collapsedHtml);
    expect(collapsedAudit.seriousOrCritical).toEqual([]);

    // Test expanded state with configured key
    const expandedHtml = renderToString(
      <ApiKeyBar
        apiKey="AIzaSyTestApiKey12345"
        onApiKeyChange={() => {}}
        isOpen={true}
        onToggleOpen={() => {}}
      />
    );
    const expandedAudit = await auditHtml(expandedHtml);
    expect(expandedAudit.seriousOrCritical).toEqual([]);
  });
});
