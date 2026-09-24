import robotsParser from "robots-parser";
import type { FetchOptions, FetchResult } from "@/types";
import { extractPageContent } from "./extract";

export const DEFAULT_USER_AGENT = "GEOContentGapChecker/1.0 (+https://trustnodelogic.com)";
export const DEFAULT_TIMEOUT_MS = 10000;

type RobotsParserInstance = ReturnType<typeof robotsParser>;

export type RobotsCache = Map<string, Promise<RobotsParserInstance | null>>;

const globalRobotsCache: RobotsCache = new Map();

/**
 * Clears the global in-memory robots.txt cache. Useful for testing and cache reset.
 */
export function clearRobotsCache(): void {
  globalRobotsCache.clear();
}

export interface ExtendedFetchOptions extends FetchOptions {
  robotsCache?: RobotsCache;
}

/**
 * Checks whether robots.txt on the target origin permits crawling the given URL.
 *
 * What it DOES:
 * - Fetches robots.txt from the URL origin with a short timeout.
 * - Caches the robots.txt fetch and parser per origin so N URLs on the same domain only fetch robots.txt once.
 * - Uses robots-parser to test path rules against the specified user agent.
 * - Returns true if robots.txt is missing (404/non-200) or explicitly allows the path.
 * - Returns false only if robots.txt explicitly disallows the URL for the user agent.
 *
 * What it DOES NOT DO:
 * - Does not parse XML sitemaps or follow sitemap links.
 * - Does not perform rate-limiting delay sleeps based on crawl-delay.
 */
export async function isRobotsAllowed(
  targetUrl: string,
  userAgent: string = DEFAULT_USER_AGENT,
  timeoutMs: number = 5000,
  robotsCache?: RobotsCache
): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const robotsUrl = `${origin}/robots.txt`;
    const cacheKey = `${origin}::${userAgent}`;

    const cache = robotsCache || globalRobotsCache;

    let parserPromise = cache.get(cacheKey);
    if (!parserPromise) {
      parserPromise = (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const res = await fetch(robotsUrl, {
            signal: controller.signal,
            headers: {
              "User-Agent": userAgent,
              Accept: "text/plain, text/*, */*",
            },
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            // 404 or missing robots.txt means crawling is permitted
            return null;
          }

          const robotsTxt = await res.text();
          return robotsParser(robotsUrl, robotsTxt);
        } catch {
          // If robots.txt cannot be fetched or times out, default to allowing
          return null;
        }
      })();

      cache.set(cacheKey, parserPromise);
    }

    const robots = await parserPromise;
    if (!robots) {
      return true;
    }

    const allowed = robots.isAllowed(targetUrl, userAgent);
    return allowed !== false;
  } catch {
    // If robots.txt cannot be fetched or times out, default to allowing
    return true;
  }
}

/**
 * Fetches raw HTML for a single URL with timeout, user-agent, and robots.txt check.
 *
 * Redirect behavior:
 * - Uses native fetch with redirect: "follow".
 * - Automatically follows 301, 302, 303, 307, and 308 redirects up to the standard limit of 20 hops.
 * - Captures and returns the final landed URL (response.url) after all redirect hops complete.
 * - Does not return 3xx intermediate responses directly; it completes the redirect chain and returns the final 200 HTML.
 *
 * What it DOES:
 * - Validates that the URL uses HTTP or HTTPS protocol.
 * - Checks robots.txt permissions before fetching on the initial origin (can be disabled via options).
 * - Enforces an AbortController timeout (default 10,000 ms).
 * - Identifies with an honest user-agent header.
 * - Returns status code, final redirected URL, and raw HTML text.
 *
 * What it DOES NOT DO:
 * - Does not execute client-side JavaScript (SPAs needing JS render will get raw HTML).
 * - Does not bypass authentication, paywalls, or CAPTCHA challenges.
 * - Does not spoof browser headers to deceive bot detection.
 */
export async function fetchHtml(
  targetUrl: string,
  options?: ExtendedFetchOptions
): Promise<{ html: string; finalUrl: string; statusCode: number }> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    throw new Error(`Invalid URL format: ${targetUrl}`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}. Only http: and https: are supported.`);
  }

  const userAgent = options?.userAgent || DEFAULT_USER_AGENT;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const checkRobots = options?.checkRobots !== false;

  if (checkRobots) {
    const allowed = await isRobotsAllowed(targetUrl, userAgent, 5000, options?.robotsCache);
    if (!allowed) {
      throw new Error(`Crawling disallowed by robots.txt for URL: ${targetUrl}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} (${response.statusText}) while fetching ${targetUrl}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.includes("text/plain")) {
      throw new Error(`Non-HTML content-type received: ${contentType}`);
    }

    const html = await response.text();
    const finalUrl = response.url || targetUrl;

    return {
      html,
      finalUrl,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms while fetching ${targetUrl}`);
    }
    throw err;
  }
}

/** Alias for fetchHtml to match AGENTS.md conventions */
export const fetchUrlContent = fetchHtml;

/**
 * Fetches a single page and extracts its structured content in one combined step.
 *
 * What it DOES:
 * - Calls fetchHtml() with the configured timeout and robots.txt check.
 * - Runs extractPageContent() to parse metadata, headings, JSON-LD, and body text.
 * - Returns a unified FetchResult object with success flag and structured data or error message.
 *
 * What it DOES NOT DO:
 * - Does not perform GEO scoring or cross-page gap analysis.
 */
export async function fetchAndExtract(
  url: string,
  options?: ExtendedFetchOptions
): Promise<FetchResult> {
  try {
    const { html, finalUrl, statusCode } = await fetchHtml(url, options);
    const data = extractPageContent(html, finalUrl);

    return {
      success: true,
      url,
      statusCode,
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      url,
      error: message,
    };
  }
}
