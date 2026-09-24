import type { ExtractedContent, StatisticsCheckResult, StatisticFinding } from "@/types";

const PERCENTAGE_REGEX = /\b(\d+(?:\.\d+)?\s*(?:%|percent\b|percentage points\b))/gi;
const METRIC_QUANTITY_REGEX = /\b(?:\$|€|£)\s*\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:billion|million|trillion|k|m|b))?\b|\b\d+(?:\.\d+)?\s*(?:ms|seconds|minutes|hours|days|GB|TB|MB|kbps|Gbps|tokens|parameters|entries|sections|axes|axis|dimensions|studies|datapoints)\b|\b\d+x\b/gi;
const RATIO_REGEX = /\b(?:\d+\s+out\s+of\s+\d+|\d+\s+in\s+\d+|\d+:\d+)\b/gi;
const DATED_POINT_REGEX = /\b(?:in|by|since|during|between|as of|dated)\s+(?:19\d\d|20\d\d|Q[1-4]\s*20\d\d)\b/gi;

/**
 * Detects concrete statistics, numerical benchmarks, percentages, and dated evidence in content.
 *
 * What it DOES:
 * - Scans body text for percentage indicators (e.g. 35%, 12.5 percent).
 * - Identifies currency and technical unit measurements (e.g. $10M, 50ms, 17 entries).
 * - Identifies ratios and distributions (e.g. 1 in 4, 3 out of 5).
 * - Identifies dated historical/research data points (e.g. in 2024, as of Q3 2025).
 * - Returns pass/fail status, total statistics count, and itemized match snippets.
 *
 * What it DOES NOT DO:
 * - Does not perform statistical validity verification or data recalculation.
 * - Does not verify if cited statistical claims are accurate.
 */
export function checkStatistics(content: ExtractedContent): StatisticsCheckResult {
  const findings: StatisticFinding[] = [];
  const seenMatches = new Set<string>();

  const scanParagraph = (text: string) => {
    // 1. Percentages
    let match: RegExpExecArray | null;
    PERCENTAGE_REGEX.lastIndex = 0;
    while ((match = PERCENTAGE_REGEX.exec(text)) !== null) {
      const val = match[1].trim();
      const key = `pct_${val.toLowerCase()}`;
      if (!seenMatches.has(key)) {
        seenMatches.add(key);
        findings.push({
          value: val,
          category: "percentage",
          context: text.slice(Math.max(0, match.index - 25), Math.min(text.length, match.index + val.length + 35)).trim(),
        });
      }
    }

    // 2. Metric Quantities
    METRIC_QUANTITY_REGEX.lastIndex = 0;
    while ((match = METRIC_QUANTITY_REGEX.exec(text)) !== null) {
      const val = match[0].trim();
      const key = `qty_${val.toLowerCase()}`;
      if (!seenMatches.has(key)) {
        seenMatches.add(key);
        findings.push({
          value: val,
          category: "metric_quantity",
          context: text.slice(Math.max(0, match.index - 25), Math.min(text.length, match.index + val.length + 35)).trim(),
        });
      }
    }

    // 3. Ratios
    RATIO_REGEX.lastIndex = 0;
    while ((match = RATIO_REGEX.exec(text)) !== null) {
      const val = match[0].trim();
      const key = `rat_${val.toLowerCase()}`;
      if (!seenMatches.has(key)) {
        seenMatches.add(key);
        findings.push({
          value: val,
          category: "ratio",
          context: text.slice(Math.max(0, match.index - 25), Math.min(text.length, match.index + val.length + 35)).trim(),
        });
      }
    }

    // 4. Dated Points
    DATED_POINT_REGEX.lastIndex = 0;
    while ((match = DATED_POINT_REGEX.exec(text)) !== null) {
      const val = match[0].trim();
      const key = `date_${val.toLowerCase()}`;
      if (!seenMatches.has(key)) {
        seenMatches.add(key);
        findings.push({
          value: val,
          category: "dated_point",
          context: text.slice(Math.max(0, match.index - 25), Math.min(text.length, match.index + val.length + 35)).trim(),
        });
      }
    }
  };

  for (const paragraph of content.paragraphs) {
    scanParagraph(paragraph);
  }

  const passed = findings.length > 0;
  const summary = passed
    ? `Passed. Detected ${findings.length} empirical statistical indicator(s) (percentages, metrics, or dated benchmarks).`
    : "Failed. No numerical statistics, percentages, or dated data points detected.";

  return {
    passed,
    count: findings.length,
    findings,
    summary,
  };
}
