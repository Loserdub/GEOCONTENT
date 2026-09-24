import type { ExtractedContent, MetaDescriptionCheckResult } from "@/types";

/**
 * Checks meta description length (120-155 chars) and consistency across meta, OpenGraph, and Twitter tags.
 *
 * What it DOES:
 * - Measures primary meta description character count against the 120-155 optimal character range.
 * - Compares meta description against og:description and twitter:description for cross-platform parity.
 * - Returns pass/fail status, length evaluation status, and tag values.
 *
 * What it DOES NOT DO:
 * - Does not evaluate readability or marketing conversion quality of the description copy.
 * - Does not rewrite or suggest alternative meta description copy.
 */
export function checkMetaDescription(content: ExtractedContent): MetaDescriptionCheckResult {
  const primaryDesc = content.metaDescription?.trim() || "";
  const ogDesc = content.ogDescription?.trim() || null;
  const twitterDesc = content.twitterDescription?.trim() || null;

  const charCount = primaryDesc.length;

  let lengthStatus: "optimal" | "too_short" | "too_long" | "missing" = "optimal";
  if (charCount === 0) {
    lengthStatus = "missing";
  } else if (charCount < 120) {
    lengthStatus = "too_short";
  } else if (charCount > 155) {
    lengthStatus = "too_long";
  } else {
    lengthStatus = "optimal";
  }

  const inOptimalRange = lengthStatus === "optimal";

  // Consistency check: check if present tags match
  const presentTags = [primaryDesc, ogDesc, twitterDesc].filter((t): t is string => Boolean(t && t.length > 0));
  let isConsistent = true;
  if (presentTags.length > 1) {
    const first = presentTags[0];
    isConsistent = presentTags.every((t) => t === first);
  } else if (presentTags.length === 0) {
    isConsistent = false;
  }

  const passed = inOptimalRange && (primaryDesc.length > 0);

  let summary = "";
  if (lengthStatus === "missing") {
    summary = "Failed. Primary meta description tag is missing.";
  } else if (lengthStatus === "too_short") {
    summary = `Caution. Meta description is ${charCount} characters (too short; recommended range is 120-155 characters).`;
  } else if (lengthStatus === "too_long") {
    summary = `Caution. Meta description is ${charCount} characters (too long; may be truncated in search snippets; recommended range is 120-155 characters).`;
  } else {
    summary = `Passed. Meta description is ${charCount} characters (optimal range 120-155).`;
  }

  if (primaryDesc && !isConsistent && (ogDesc || twitterDesc)) {
    summary += " Discrepancy detected across standard, OG, or Twitter description tags.";
  }

  return {
    passed,
    charCount,
    inOptimalRange,
    lengthStatus,
    isConsistent,
    metaDesc: content.metaDescription,
    ogDesc: content.ogDescription,
    twitterDesc: content.twitterDescription,
    summary,
  };
}
