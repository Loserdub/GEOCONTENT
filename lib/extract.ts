import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import type { ExtractedContent, HeadingItem, OutboundLink } from "@/types";

/**
 * Extracts structured content, metadata, and clean body text from raw HTML.
 *
 * What it DOES:
 * - Extracts title, canonical URL, meta description, og:description, twitter:description using cheerio.
 * - Extracts headings (H1-H6) in document order.
 * - Extracts and parses all application/ld+json scripts into JSON objects.
 * - Identifies outbound links to external domains with text and domain names.
 * - Extracts clean main body text using Mozilla Readability with JSDOM, stripping nav/footer/ads.
 * - Provides a resilient fallback body extraction via cheerio if Readability yields empty content.
 * - Calculates clean word count and extracts paragraph blocks.
 *
 * What it DOES NOT DO:
 * - Does not perform GEO tactic scoring or pass/fail detection (handled in detectors).
 * - Does not make external network requests to validate sameAs URLs (handled in schema detector).
 * - Does not make LLM calls for topic extraction or tone scoring.
 */
export function extractPageContent(html: string, pageUrl: string): ExtractedContent {
  const $ = cheerio.load(html);

  let currentHost = "";
  try {
    currentHost = new URL(pageUrl).hostname.toLowerCase();
  } catch {
    currentHost = "";
  }

  // 1. Meta and Title
  const rawTitle = $("title").first().text().trim();
  const ogTitle = $('meta[property="og:title"]').attr("content") || $('meta[name="og:title"]').attr("content") || "";
  const title = rawTitle || ogTitle || $("h1").first().text().trim() || "";

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="description"]').attr("content")?.trim() ||
    null;

  const ogDescription =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="og:description"]').attr("content")?.trim() ||
    null;

  const twitterDescription =
    $('meta[name="twitter:description"]').attr("content")?.trim() ||
    $('meta[property="twitter:description"]').attr("content")?.trim() ||
    null;

  const canonicalHref = $('link[rel="canonical"]').attr("href")?.trim();
  let canonicalUrl: string | null = null;
  if (canonicalHref) {
    try {
      canonicalUrl = new URL(canonicalHref, pageUrl).toString();
    } catch {
      canonicalUrl = canonicalHref;
    }
  }

  // 2. Headings (H1 to H6)
  const headings: HeadingItem[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, elem) => {
    const tagName = elem.tagName.toLowerCase();
    const level = parseInt(tagName.replace("h", ""), 10);
    const text = $(elem).text().replace(/\s+/g, " ").trim();
    if (text) {
      headings.push({ level, text });
    }
  });

  // 3. JSON-LD blocks
  const jsonLd: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, elem) => {
    const rawContent = $(elem).html();
    if (!rawContent) return;
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            jsonLd.push(item as Record<string, unknown>);
          }
        }
      } else if (parsed && typeof parsed === "object") {
        const rootContext = (parsed as Record<string, unknown>)["@context"];
        if (Array.isArray((parsed as Record<string, unknown>)["@graph"])) {
          const graph = (parsed as Record<string, unknown>)["@graph"] as unknown[];
          for (const item of graph) {
            if (item && typeof item === "object") {
              const node = { ...(item as Record<string, unknown>) };
              if (!node["@context"] && rootContext) {
                node["@context"] = rootContext;
              }
              jsonLd.push(node);
            }
          }
        } else {
          jsonLd.push(parsed as Record<string, unknown>);
        }
      }
    } catch {
      // Record unparseable JSON-LD with error tag for schema validation
      jsonLd.push({ _parseError: true, rawContent: rawContent.slice(0, 500) });
    }
  });

  // 4. Outbound links
  const outboundLinks: OutboundLink[] = [];
  const seenUrls = new Set<string>();

  $("a[href]").each((_, elem) => {
    const href = $(elem).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    try {
      const parsedLink = new URL(href, pageUrl);
      const linkHost = parsedLink.hostname.toLowerCase();
      // Outbound if link has a host and differs from current page host
      if (linkHost && currentHost && linkHost !== currentHost && !linkHost.endsWith(`.${currentHost}`)) {
        const fullHref = parsedLink.toString();
        if (!seenUrls.has(fullHref)) {
          seenUrls.add(fullHref);
          const linkText = $(elem).text().replace(/\s+/g, " ").trim();
          outboundLinks.push({
            href: fullHref,
            text: linkText,
            domain: linkHost,
          });
        }
      }
    } catch {
      // Invalid URL skipped
    }
  });

  // 5. Main content extraction using Readability + JSDOM
  let bodyText = "";
  const paragraphs: string[] = [];

  try {
    const dom = new JSDOM(html, { url: pageUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent) {
      bodyText = article.textContent.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();
      
      // Parse article HTML to extract individual paragraphs and blockquotes
      if (article.content) {
        const articleCheerio = cheerio.load(article.content);
        articleCheerio("p, blockquote").each((_, elem) => {
          const text = articleCheerio(elem).text().replace(/\s+/g, " ").trim();
          if (text.length > 0) {
            paragraphs.push(text);
          }
        });
      }
    }
  } catch {
    // Readability failed, proceed to fallback
  }

  // 6. Fallback content extraction if Readability returned empty or very sparse text
  // TODO: Add a low-confidence fallback for non-article page structures (e.g., forum index or Hacker News list structures
  // where items are in tables or div grids without standard <p> tags, causing paragraph segmentation to collapse into a single block).
  if (!bodyText || bodyText.length < 50) {
    const clonedHtml = cheerio.load(html);
    clonedHtml("script, style, nav, footer, header, noscript, svg, iframe, form").remove();
    const mainSelection = clonedHtml("main, article, #content, .content, #main, .main, body");
    const target = mainSelection.length > 0 ? mainSelection.first() : clonedHtml("body");
    
    bodyText = target.text().replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();

    if (paragraphs.length === 0) {
      target.find("p, blockquote").each((_, elem) => {
        const text = clonedHtml(elem).text().replace(/\s+/g, " ").trim();
        if (text.length > 0) {
          paragraphs.push(text);
        }
      });
    }
  }

  // If paragraphs are still empty but bodyText exists, split on double newlines
  if (paragraphs.length === 0 && bodyText.length > 0) {
    const splitParagraphs = bodyText.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
    paragraphs.push(...splitParagraphs);
  }

  // 7. Word count calculation
  const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  return {
    url: pageUrl,
    canonicalUrl,
    title,
    metaDescription,
    ogDescription,
    twitterDescription,
    headings,
    bodyText,
    wordCount,
    paragraphs,
    jsonLd,
    outboundLinks,
  };
}
