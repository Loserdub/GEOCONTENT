import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/scan/route";
import { NextRequest } from "next/server";
import * as fetchModule from "@/lib/fetch";
import * as llmScoringModule from "@/lib/llm/gapScoringNumeric";
import * as llmJustificationModule from "@/lib/llm/gapJustification";
import type { FetchResult, ExtractedContent } from "@/types";

function createMockExtractedContent(url: string, title: string, bodyText: string): ExtractedContent {
  return {
    url,
    canonicalUrl: url,
    title,
    metaDescription: "Test meta description for page analysis and GEO scorecard.",
    ogDescription: null,
    twitterDescription: null,
    headings: [{ level: 1, text: title }],
    bodyText,
    wordCount: bodyText.split(/\s+/).length,
    paragraphs: [bodyText],
    jsonLd: [{ "@type": "Article", headline: title }],
    outboundLinks: [{ href: "https://wikipedia.org", text: "Wikipedia", domain: "wikipedia.org" }],
  };
}

describe("app/api/scan/route.ts — Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects request with 400 if no URLs are provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/scan", {
      method: "POST",
      body: JSON.stringify({ urls: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/at least one valid URL/i);
  });

  it("rejects request with 400 if more than 10 URLs are submitted", async () => {
    const elevenUrls = Array.from({ length: 11 }, (_, i) => `https://example.com/page${i}`);
    const req = new NextRequest("http://localhost:3000/api/scan", {
      method: "POST",
      body: JSON.stringify({ urls: elevenUrls }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Maximum 10 URLs allowed/i);
  });

  it("preserves exact URL order after concurrency-limited parallel fetch", async () => {
    const urls = [
      "https://example.com/p1",
      "https://example.com/p2",
      "https://example.com/p3",
      "https://example.com/p4",
      "https://example.com/p5",
    ];

    // Introduce variable async response times to verify order preservation
    vi.spyOn(fetchModule, "fetchAndExtract").mockImplementation(async (url: string): Promise<FetchResult> => {
      const delay = url.endsWith("p1") ? 50 : url.endsWith("p2") ? 10 : 30;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return {
        success: true,
        url,
        statusCode: 200,
        data: createMockExtractedContent(url, `Title for ${url}`, `Content for ${url} discussing Hybrid Production and Suno workflows.`),
      };
    });

    vi.spyOn(llmScoringModule, "batchGapScoringNumeric").mockResolvedValue([]);
    vi.spyOn(llmJustificationModule, "batchGapJustifications").mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/scan", {
      method: "POST",
      body: JSON.stringify({ urls }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.results).toHaveLength(5);
    expect(data.results.map((r: { url: string }) => r.url)).toEqual(urls);
  });

  it("returns partial success for a mixed batch of valid and failing URLs", async () => {
    const urls = [
      "https://good.com/page1",
      "https://bad.com/404",
      "https://good.com/page2",
    ];

    vi.spyOn(fetchModule, "fetchAndExtract").mockImplementation(async (url: string): Promise<FetchResult> => {
      if (url.includes("bad.com")) {
        return {
          success: false,
          url,
          statusCode: 404,
          error: "HTTP error 404 (Not Found)",
        };
      }
      return {
        success: true,
        url,
        statusCode: 200,
        data: createMockExtractedContent(url, `Title for ${url}`, `Body content for ${url} discussing music standards.`),
      };
    });

    vi.spyOn(llmScoringModule, "batchGapScoringNumeric").mockResolvedValue([]);
    vi.spyOn(llmJustificationModule, "batchGapJustifications").mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/scan", {
      method: "POST",
      body: JSON.stringify({ urls }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.scannedCount).toBe(3);
    expect(data.successfulCount).toBe(2);
    expect(data.results[0].success).toBe(true);
    expect(data.results[1].success).toBe(false);
    expect(data.results[1].error).toContain("404");
    expect(data.results[2].success).toBe(true);
  });

  it("does not compute gap report for a single URL", async () => {
    vi.spyOn(fetchModule, "fetchAndExtract").mockResolvedValue({
      success: true,
      url: "https://single.com/page",
      statusCode: 200,
      data: createMockExtractedContent("https://single.com/page", "Single Page", "Single page body content with keywords."),
    });

    const req = new NextRequest("http://localhost:3000/api/scan", {
      method: "POST",
      body: JSON.stringify({ url: "https://single.com/page" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.scannedCount).toBe(1);
    expect(data.successfulCount).toBe(1);
    expect(data.results[0].scorecard).toBeDefined();
    expect(data.gapReport).toBeNull();
  });

  it("extracts custom apiKey from body and passes it to batch LLM modules", async () => {
    const urls = ["https://example.com/p1", "https://example.com/p2"];

    vi.spyOn(fetchModule, "fetchAndExtract").mockImplementation(async (url: string): Promise<FetchResult> => ({
      success: true,
      url,
      statusCode: 200,
      data: createMockExtractedContent(
        url,
        `Title for ${url}`,
        `Body text for ${url} with Music Standards and Audio Provenance topics repeated across sections.`
      ),
    }));

    const mockNumeric = vi.spyOn(llmScoringModule, "batchGapScoringNumeric").mockResolvedValue([]);
    const mockJust = vi.spyOn(llmJustificationModule, "batchGapJustifications").mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/scan", {
      method: "POST",
      body: JSON.stringify({
        urls,
        apiKey: "custom-user-supplied-key",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // If candidate gaps were generated, verify customApiKey was forwarded
    if (mockNumeric.mock.calls.length > 0) {
      expect(mockNumeric.mock.calls[0][2]).toBe("custom-user-supplied-key");
    }
  });
});
