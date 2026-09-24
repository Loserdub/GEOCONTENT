import type { ExtractedContent, PageScorecard, AnalyzePageOptions } from "@/types";
import { checkCitations } from "./citeSources";
import { checkQuotations } from "./quotations";
import { checkStatistics } from "./statistics";
import { checkKeywordStuffing } from "./keywordStuffing";
import { validateSchema } from "./schemaValidation";
import { checkMetaDescription } from "./metaDescription";
import { checkStructure } from "./structuralChecks";

export {
  checkCitations,
  checkQuotations,
  checkStatistics,
  checkKeywordStuffing,
  validateSchema,
  checkMetaDescription,
  checkStructure,
};

/**
 * Runs all GEO tactic and structural detectors against extracted page content.
 *
 * What it DOES:
 * - Runs validated tactic checks (citations, quotations, statistics, keyword stuffing).
 * - Forwards optional custom authority domains to the citation checker.
 * - Runs structural checks (Schema.org validation, meta description length/parity, abstract/flow).
 * - Returns a unified PageScorecard data structure containing pass/fail flags, counts, and findings.
 *
 * What it DOES NOT DO:
 * - Does not perform LLM qualitative tone scoring (explicitly deferred for M4).
 * - Does not compute cross-page topic co-occurrence gap scores (handled in M3/M4).
 */
export function analyzePage(
  content: ExtractedContent,
  options?: AnalyzePageOptions
): PageScorecard {
  const citeSources = checkCitations(content, {
    customAuthorityDomains: options?.customAuthorityDomains,
  });
  const quotations = checkQuotations(content);
  const statistics = checkStatistics(content);
  const keywordStuffing = checkKeywordStuffing(content);

  const schemaValidation = validateSchema(content);
  const metaDescription = checkMetaDescription(content);
  const abstractAndFlow = checkStructure(content);

  return {
    url: content.url,
    timestamp: new Date().toISOString(),
    tactics: {
      citeSources,
      quotations,
      statistics,
      keywordStuffing,
      fluencyAuthoritativeTone: {
        status: "deferred",
        note: "Qualitative LLM-based fluency and tone evaluation is deferred to milestone 4.",
      },
    },
    structural: {
      schemaValidation,
      metaDescription,
      abstractAndFlow,
    },
  };
}
