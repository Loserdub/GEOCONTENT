import type { ScanResultPayload, GapReport, ScoredGap } from "@/types";

/**
 * Generates a clean, comprehensive Markdown report from scan results and gap analysis.
 *
 * What it DOES:
 * - Formats executive summary metadata (date, URL count, recurring topics).
 * - Formats the Ranked Topical Gap Report table with D/C/S/F/T factors and prose justifications.
 * - Formats detailed per-page scorecards with GEO tactic checklists and structural quality audits.
 * - Formats source page attributions for each gap.
 * - Pure formatting function with 0 external dependencies or network calls.
 *
 * What it DOES NOT DO:
 * - Does not make API calls, fetch content, or calculate scores.
 */
export function generateMarkdownReport(
  results: ScanResultPayload[],
  gapReport?: GapReport | null
): string {
  const timestamp = new Date().toUTCString();
  const successfulScans = results.filter((r) => r.success && r.scorecard);
  const failedScans = results.filter((r) => !r.success);

  const lines: string[] = [];

  // Title & Header
  lines.push("# GEO Content & Topical Gap Analysis Report");
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(`**Scanned Pages:** ${results.length} (${successfulScans.length} successful, ${failedScans.length} failed)`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 1: Executive Summary
  lines.push("## 1. Executive Summary");
  lines.push("");
  if (gapReport && gapReport.topGaps.length > 0) {
    const topGap = gapReport.topGaps[0];
    lines.push(`- **Primary Identified Content Gap:** "${topGap.topicA}" <──> "${topGap.topicB}" (G Priority Score: **${topGap.G.toFixed(1)}**, G_amplified: **${topGap.G_amplified.toFixed(1)}**)`);
    lines.push(`- **Total Candidate Gaps Evaluated:** ${gapReport.totalCandidatesFound}`);
    lines.push(`- **Recurring Cross-Page Topics:** ${gapReport.recurringTopics.length}`);
    if (gapReport.candidatesExcluded > 0) {
      lines.push(`- **Excluded Above Batch Cap:** ${gapReport.candidatesExcluded} additional candidate pairs identified but not scored in this pass.`);
    }
  } else if (results.length === 1) {
    lines.push("- **Scan Type:** Single-page scorecard analysis (multi-page gap mapping requires 2+ URLs).");
  } else {
    lines.push("- **Topical Gaps:** No candidate gaps found among recurring topics across scanned pages.");
  }
  lines.push("");

  // Section 2: Topical Gap Prioritization Report (if multi-page)
  if (gapReport && gapReport.topGaps.length > 0) {
    lines.push("## 2. Topical Gap Prioritization Report");
    lines.push("");
    lines.push("Candidate topic pairs that exist on different pages of the site but never co-occur together on any single page, scored by the GEO gap formula: `G = (D + C) * S / F`.");
    lines.push("");
    lines.push("| Rank | Topic Pair | G Score | G_amplified | D (Depth) | C (Connectivity) | S (Search) | F (Friction) |");
    lines.push("|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|");

    gapReport.topGaps.forEach((gap: ScoredGap, idx: number) => {
      lines.push(
        `| ${idx + 1} | **${gap.topicA}** ↔ **${gap.topicB}** | **${gap.G.toFixed(1)}** | **${gap.G_amplified.toFixed(1)}** | ${gap.D}/10 | ${gap.C}/10 | ${gap.S}/10 | ${gap.F}/10 |`
      );
    });

    lines.push("");
    lines.push("### Gap Details & Factor Justifications");
    lines.push("");

    gapReport.topGaps.forEach((gap: ScoredGap, idx: number) => {
      lines.push(`#### ${idx + 1}. "${gap.topicA}" ↔ "${gap.topicB}"`);
      lines.push(`- **G Priority Score:** ${gap.G.toFixed(2)} | **G_amplified:** ${gap.G_amplified.toFixed(2)} (T=${gap.T})`);
      if (gap.rationale) {
        lines.push(`- **D (Topical Depth):** ${gap.D}/10 — ${gap.rationale.D}`);
        lines.push(`- **C (Connectivity):** ${gap.C}/10 — ${gap.rationale.C}`);
        lines.push(`- **S (Search Demand):** ${gap.S}/10 — ${gap.rationale.S}`);
        lines.push(`- **F (Creation Friction):** ${gap.F}/10 — ${gap.rationale.F}`);
      }
      lines.push(`- **Source Pages for "${gap.topicA}":** ${gap.pagesA.join(", ")}`);
      lines.push(`- **Source Pages for "${gap.topicB}":** ${gap.pagesB.join(", ")}`);
      lines.push("");
    });

    // Recurring Topics Breakdown
    lines.push("### Recurring Topics Map (Found on 2+ Pages)");
    lines.push("");
    lines.push("| Topic | Type | Scanned Page Count | Source URLs |");
    lines.push("|:---|:---:|:---:|:---|");
    for (const t of gapReport.recurringTopics) {
      lines.push(`| **${t.topic}** | ${t.type} | ${t.pageCount} | ${t.pageUrls.join(", ")} |`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Section 3: Per-Page Scorecards
  lines.push("## 3. Individual Page Scorecards");
  lines.push("");

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    const sc = res.scorecard;
    const ext = res.extracted;

    lines.push(`### Page ${i + 1}: ${ext?.title || res.url}`);
    lines.push(`- **URL:** ${res.url}`);
    lines.push(`- **Status:** ${res.success ? "Successfully Analyzed" : `Failed (${res.error || "Unknown Error"})`}`);
    if (ext) {
      lines.push(`- **Word Count:** ${ext.wordCount.toLocaleString()} words`);
      lines.push(`- **Outbound Links:** ${ext.outboundLinks.length}`);
    }
    lines.push("");

    if (!res.success || !sc || !ext) {
      lines.push(`> ⚠ **Extraction Failure:** ${res.error || "Could not fetch or parse content."}`);
      lines.push("");
      continue;
    }

    // GEO Tactics
    lines.push("#### Validated GEO Tactics (Aggarwal et al.)");
    lines.push("");
    lines.push(`- **Cite Sources:** ${sc.tactics.citeSources.passed ? "✅ PASS" : "❌ FAIL"} — ${sc.tactics.citeSources.summary}`);
    if (sc.tactics.citeSources.findings.length > 0) {
      for (const f of sc.tactics.citeSources.findings.slice(0, 5)) {
        lines.push(`  - [${f.type}] \`${f.source}\`: ${f.context}`);
      }
    }

    lines.push(`- **Quotation Addition:** ${sc.tactics.quotations.passed ? "✅ PASS" : "❌ FAIL"} — ${sc.tactics.quotations.summary}`);
    if (sc.tactics.quotations.findings.length > 0) {
      for (const q of sc.tactics.quotations.findings.slice(0, 3)) {
        lines.push(`  - "${q.quote}" (Attribution: ${q.attribution})`);
      }
    }

    lines.push(`- **Statistics Addition:** ${sc.tactics.statistics.passed ? "✅ PASS" : "❌ FAIL"} — ${sc.tactics.statistics.summary}`);
    if (sc.tactics.statistics.findings.length > 0) {
      for (const s of sc.tactics.statistics.findings.slice(0, 4)) {
        lines.push(`  - \`${s.value}\` (${s.category}): ${s.context}`);
      }
    }

    lines.push(`- **Keyword Stuffing:** ${sc.tactics.keywordStuffing.passed ? "✅ CLEAN" : "⚠ FLAGGED"} — ${sc.tactics.keywordStuffing.summary}`);
    if (sc.tactics.keywordStuffing.topKeywords.length > 0) {
      const topKws = sc.tactics.keywordStuffing.topKeywords
        .slice(0, 5)
        .map((k) => `\`${k.term}\` (${k.densityPercent}% / ${k.count}x)`)
        .join(", ");
      lines.push(`  - Top Keyword Densities: ${topKws}`);
    }
    lines.push("");

    // Structural Quality
    lines.push("#### Structural & Metadata Quality");
    lines.push("");
    lines.push(`- **Schema.org Structured Data:** ${sc.structural.schemaValidation.passed ? "✅ PASS" : "❌ FAIL"} — ${sc.structural.schemaValidation.summary}`);
    if (sc.structural.schemaValidation.errors.length > 0) {
      for (const err of sc.structural.schemaValidation.errors) {
        lines.push(`  - ⚠ ${err}`);
      }
    }

    lines.push(`- **Meta Description:** ${sc.structural.metaDescription.passed ? "✅ OPTIMAL" : `⚠ ${sc.structural.metaDescription.lengthStatus.toUpperCase()}`} — ${sc.structural.metaDescription.summary}`);
    if (ext.metaDescription) {
      lines.push(`  - Content: "${ext.metaDescription}"`);
    }

    lines.push(`- **Semantic Abstract:** ${sc.structural.abstractAndFlow.semanticAbstract.passed ? "✅ PASS" : "⚠ CAUTION"} — ${sc.structural.abstractAndFlow.semanticAbstract.summary}`);
    lines.push(`- **Zone Flow:** ${sc.structural.abstractAndFlow.zoneDistribution.summary}`);
    lines.push(`- **Logical Transitions:** ${sc.structural.abstractAndFlow.logicalChain.summary}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
