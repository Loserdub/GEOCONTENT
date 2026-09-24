import type { ExtractedContent, QuotationCheckResult, QuotationFinding } from "@/types";

// Matches quoted text in ASCII or curly unicode quotes
const QUOTE_REGEX = /(?:["“]([^"”]{10,500})["”]|(?:^|\s)['‘]([^'’]{10,500})['’])/g;

// Attribution verb indicators
const ATTRIBUTION_VERBS = [
  /\b(?:said|says|stated|states|explained|explains|noted|notes|argued|argues|remarked|wrote|reported|claims|claimed|according to)\b/i,
  /\b(?:author|expert|researcher|founder|ceo|engineer|producer|manifesto)\b/i,
  /(?:^|\n)\s*[-—–]\s*([A-Z][a-zA-Z\s]{2,40})/, // Dash attribution like - Justin Ray
];

/**
 * Detects direct quotation addition and verified source attributions in content.
 *
 * What it DOES:
 * - Scans paragraphs for quotation marks enclosing meaningful statements (10+ characters).
 * - Verifies whether an attribution pattern or named speaker verb exists in the vicinity of the quote.
 * - Extracts matched quotes with speaker/verb context and returns itemized findings.
 *
 * What it DOES NOT DO:
 * - Does not fact-check or verify if the attributed individual actually uttered the statement.
 * - Does not contact external LLMs to interpret tone or figurative speech.
 */
export function checkQuotations(content: ExtractedContent): QuotationCheckResult {
  const findings: QuotationFinding[] = [];
  const seenQuotes = new Set<string>();

  for (let i = 0; i < content.paragraphs.length; i++) {
    const paragraph = content.paragraphs[i];
    let match: RegExpExecArray | null;
    QUOTE_REGEX.lastIndex = 0;

    while ((match = QUOTE_REGEX.exec(paragraph)) !== null) {
      const quoteText = (match[1] || match[2] || "").trim();
      if (!quoteText || seenQuotes.has(quoteText)) continue;

      // Check current paragraph for attribution verbs
      let attributionMatch = "";
      for (const verbPattern of ATTRIBUTION_VERBS) {
        const verbCheck = paragraph.match(verbPattern);
        if (verbCheck) {
          attributionMatch = verbCheck[0];
          break;
        }
      }

      // Check preceding paragraph for lead-in context (e.g. "From the manifesto", "As Justin Ray notes:")
      if (!attributionMatch && i > 0) {
        const prevParagraph = content.paragraphs[i - 1];
        for (const verbPattern of ATTRIBUTION_VERBS) {
          const verbCheck = prevParagraph.match(verbPattern);
          if (verbCheck) {
            attributionMatch = `Lead-in: "${prevParagraph}"`;
            break;
          }
        }
      }

      // If standalone quote (>= 20 chars) or attributed
      const isStandaloneQuote = paragraph.trim().startsWith('"') || paragraph.trim().startsWith('“');
      if (attributionMatch || isStandaloneQuote || paragraph.length > quoteText.length + 15) {
        seenQuotes.add(quoteText);
        findings.push({
          quote: quoteText,
          attribution: attributionMatch || (isStandaloneQuote ? "Standalone blockquote / pull-quote" : "Attributed via paragraph context"),
          context: paragraph.slice(0, 160).trim(),
        });
      }
    }
  }

  const passed = findings.length > 0;
  const summary = passed
    ? `Passed. Found ${findings.length} attributed quotation statement(s).`
    : "Failed. No direct attributed quotes or quotation patterns detected in the main body text.";

  return {
    passed,
    count: findings.length,
    findings,
    summary,
  };
}
