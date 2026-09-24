import type { ExtractedContent, CitationCheckResult, CitationFinding } from "@/types";

/**
 * Generic high-authority reference domains recognized across all verticals.
 * This list is intentionally limited to universally recognized academic,
 * government, standards-body, and major reference sources. It is NOT meant
 * to be exhaustive for any particular industry.
 *
 * For client-specific scans, supply additional domains via the
 * `customAuthorityDomains` option (e.g. "musicbrainz.org" for a music
 * client, "nist.gov" for manufacturing, trade publications for any niche).
 */
export const DEFAULT_AUTHORITY_DOMAINS = [
  // Academic & research
  "wikipedia.org",
  "arxiv.org",
  "doi.org",
  "scholar.google.com",
  "nature.com",
  "sciencedirect.com",
  "springer.com",
  "ieee.org",
  "acm.org",
  "jstor.org",
  "pubmed.ncbi.nlm.nih.gov",
  // Government & standards
  "nih.gov",
  "ncbi.nlm.nih.gov",
  "cdc.gov",
  "who.int",
  "w3.org",
  "ietf.org",
  // Major recognized news outlets
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
  "nytimes.com",
  "washingtonpost.com",
  "wsj.com",
  "theguardian.com",
  // Developer / technical reference
  "github.com",
  "stackoverflow.com",
];

/**
 * Domains excluded from the "distinct third-party" weak citation signal.
 * These are social platforms, CDNs, analytics, and infrastructure domains
 * that do not constitute a meaningful editorial citation even when linked.
 */
const EXCLUDED_THIRD_PARTY_DOMAINS = new Set([
  // Social media
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "pinterest.com",
  "reddit.com",
  "threads.net",
  "mastodon.social",
  // Video / media hosting
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  // CDNs and infrastructure
  "cloudflare.com",
  "googleapis.com",
  "gstatic.com",
  "amazonaws.com",
  "cloudfront.net",
  "akamaized.net",
  "fastly.net",
  "cdn.jsdelivr.net",
  "unpkg.com",
  "cdnjs.cloudflare.com",
  // Analytics & tracking
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "hotjar.com",
  // Generic link shorteners
  "bit.ly",
  "t.co",
  "goo.gl",
  "tinyurl.com",
  // App stores
  "apps.apple.com",
  "play.google.com",
]);

const IN_TEXT_CITATION_PATTERNS = [
  /\baccording to ([A-Z][a-z0-9A-Z_]+(?:\s+[A-Z][a-z0-9A-Z_]+)*)/i,
  /\(Source:?\s*([^)]+)\)/i,
  /\bsource:?\s*([A-Z][a-zA-Z0-9.\s]+)/i,
  /\b(?:study|report|survey|paper|research) (?:by|from|published in) ([A-Z][a-zA-Z0-9.\s]+)/i,
  /\bas reported by ([A-Z][a-zA-Z0-9.\s]+)/i,
  /\[(\d{1,3})\]/g, // Standard academic numeric citation brackets like [1], [23]
];

export interface CitationCheckOptions {
  /**
   * Additional domains to treat as high-authority for this specific scan.
   * Use this to supply industry-relevant domains for whatever client
   * vertical is being scanned (e.g. "musicbrainz.org" for music,
   * "ansi.org" for manufacturing). These are merged with the default
   * generic authority list, not replacing it.
   */
  customAuthorityDomains?: string[];
}

/**
 * Detects research-validated citation tactics in extracted content.
 *
 * What it DOES:
 * - Checks outbound links for high-authority academic/gov/news domains from a generic,
 *   industry-agnostic default list.
 * - Accepts an optional `customAuthorityDomains` list per scan so users can supply
 *   industry-relevant domains for any client vertical without baking them into code.
 * - Counts "distinct third-party domain" links as a separate weak citation signal:
 *   any outbound link to a domain that is not the page's own site, not a common
 *   social/CDN/analytics domain, and not already counted as high-authority.
 * - Scans body text and paragraphs for explicit in-text attribution and citation patterns.
 * - Returns pass/fail status, counts by tier, and detailed findings.
 *
 * What it DOES NOT DO:
 * - Does not verify live HTTP reachability of outbound cited URLs.
 * - Does not look up PageRank, Domain Authority, or third-party paid backlink metrics.
 * - Does not hardcode industry-specific domain lists. The default list is intentionally
 *   generic and expected to be supplemented per client via customAuthorityDomains.
 */
export function checkCitations(
  content: ExtractedContent,
  options?: CitationCheckOptions
): CitationCheckResult {
  const findings: CitationFinding[] = [];
  let highAuthorityCount = 0;
  let thirdPartyCount = 0;
  let inTextCitationCount = 0;

  // Merge default + custom authority domains
  const authorityDomains = [...DEFAULT_AUTHORITY_DOMAINS];
  if (options?.customAuthorityDomains) {
    for (const d of options.customAuthorityDomains) {
      const normalized = d.toLowerCase().trim();
      if (normalized && !authorityDomains.includes(normalized)) {
        authorityDomains.push(normalized);
      }
    }
  }

  // Determine the page's own domain for self-link exclusion
  let pageDomain = "";
  try {
    pageDomain = new URL(content.url).hostname.toLowerCase();
  } catch {
    // ignore
  }
  // Also extract the registrable base (e.g. "trustnodelogic.com" from "www.trustnodelogic.com")
  const pageDomainBase = pageDomain.split(".").slice(-2).join(".");

  // 1. Analyze Outbound Links
  for (const link of content.outboundLinks) {
    const domainLower = link.domain.toLowerCase();
    const isGovOrEdu =
      domainLower.endsWith(".gov") ||
      domainLower.endsWith(".edu") ||
      domainLower.endsWith(".gov.uk") ||
      domainLower.endsWith(".ac.uk");
    const isAuthority = authorityDomains.some(
      (d) => domainLower === d || domainLower.endsWith(`.${d}`)
    );

    if (isGovOrEdu || isAuthority) {
      highAuthorityCount++;
      let citationType: CitationFinding["type"] = "high_authority_link";
      if (
        isAuthority &&
        (domainLower.includes("arxiv") ||
          domainLower.includes("doi") ||
          domainLower.includes("nature") ||
          domainLower.includes("springer") ||
          domainLower.includes("scholar.google"))
      ) {
        citationType = "academic_source";
      }

      findings.push({
        type: citationType,
        source: link.domain,
        context: link.text
          ? `[Authority] "${link.text}" -> ${link.href}`
          : link.href,
      });
    } else {
      // Check if this is a distinct third-party domain (weak citation signal)
      const linkBase = domainLower.split(".").slice(-2).join(".");
      const isSameSite =
        linkBase === pageDomainBase ||
        domainLower === pageDomain ||
        domainLower.endsWith(`.${pageDomain}`);
      const isExcluded =
        EXCLUDED_THIRD_PARTY_DOMAINS.has(domainLower) ||
        EXCLUDED_THIRD_PARTY_DOMAINS.has(linkBase);

      if (!isSameSite && !isExcluded) {
        thirdPartyCount++;
        findings.push({
          type: "third_party_reference",
          source: link.domain,
          context: link.text
            ? `[Third-Party] "${link.text}" -> ${link.href}`
            : link.href,
        });
      }
    }
  }

  // 2. Analyze In-Text Citations across Paragraphs
  for (const paragraph of content.paragraphs) {
    for (const pattern of IN_TEXT_CITATION_PATTERNS) {
      const matches = paragraph.match(pattern);
      if (matches) {
        inTextCitationCount++;
        const matchedText = matches[0];
        const snippetIndex = paragraph.indexOf(matchedText);
        const start = Math.max(0, snippetIndex - 30);
        const end = Math.min(
          paragraph.length,
          snippetIndex + matchedText.length + 30
        );
        const snippet = paragraph.slice(start, end).trim();

        findings.push({
          type: "in_text_citation",
          source: matchedText,
          context: `...${snippet}...`,
        });
      }
    }
  }

  // Pass if any strong signal exists (high-authority or in-text citations)
  // Third-party references alone don't pass, but contribute to the overall picture
  const passed = highAuthorityCount > 0 || inTextCitationCount > 0;
  const totalAttributed = highAuthorityCount + inTextCitationCount;

  let summary = "";
  if (passed) {
    const parts = [`${highAuthorityCount} high-authority link(s)`];
    if (thirdPartyCount > 0) {
      parts.push(`${thirdPartyCount} distinct third-party reference(s)`);
    }
    parts.push(`${inTextCitationCount} in-text citation pattern(s)`);
    summary = `Passed. Found ${totalAttributed} strong citation signal(s) (${parts.join(", ")}).`;
  } else if (thirdPartyCount > 0) {
    summary = `Caution. Found ${thirdPartyCount} distinct third-party reference(s) but no high-authority or formal citation patterns. Consider adding authoritative sources.`;
  } else if (content.outboundLinks.length > 0) {
    summary = `Caution. Found ${content.outboundLinks.length} outbound link(s), but none match recognized high-authority or formal citation patterns.`;
  } else {
    summary =
      "Failed. No outbound citations, high-authority references, or in-text attribution patterns detected.";
  }

  return {
    passed,
    totalOutboundCount: content.outboundLinks.length,
    highAuthorityCount,
    thirdPartyCount,
    inTextCitationCount,
    findings,
    summary,
  };
}
