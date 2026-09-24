import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isRobotsAllowed,
  clearRobotsCache,
  fetchHtml,
  fetchAndExtract,
} from "@/lib/fetch";

describe("lib/fetch — Complete fetch and robots.txt test suite", () => {
  beforeEach(() => {
    clearRobotsCache();
    vi.restoreAllMocks();
  });

  describe("Robots.txt Permission & Caching", () => {
    it("permits crawling and caches result when robots.txt is 404/not found", async () => {
      let fetchCalls = 0;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const urlStr = String(input);
        if (urlStr.includes("robots.txt")) {
          fetchCalls++;
          return new Response("Not Found", { status: 404 });
        }
        return new Response("<html><body>OK</body></html>", { status: 200 });
      });

      const allowed1 = await isRobotsAllowed("https://example.com/page1");
      const allowed2 = await isRobotsAllowed("https://example.com/page2");
      const allowed3 = await isRobotsAllowed("https://example.com/page3");

      expect(allowed1).toBe(true);
      expect(allowed2).toBe(true);
      expect(allowed3).toBe(true);
      // Origin example.com should only have triggered fetch once
      expect(fetchCalls).toBe(1);
    });

    it("correctly identifies allowed and disallowed paths from cached robots.txt", async () => {
      let fetchCalls = 0;
      const robotsTxtContent = `
User-agent: *
Disallow: /private/
Disallow: /admin
Allow: /
`;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const urlStr = String(input);
        if (urlStr.includes("robots.txt")) {
          fetchCalls++;
          return new Response(robotsTxtContent, { status: 200 });
        }
        return new Response("<html><body>OK</body></html>", { status: 200 });
      });

      const allowedPublic = await isRobotsAllowed("https://sampledomain.com/public-page");
      const allowedPrivate = await isRobotsAllowed("https://sampledomain.com/private/secret");
      const allowedAdmin = await isRobotsAllowed("https://sampledomain.com/admin");

      expect(allowedPublic).toBe(true);
      expect(allowedPrivate).toBe(false);
      expect(allowedAdmin).toBe(false);
      expect(fetchCalls).toBe(1);
    });

    it("handles concurrent requests to the same origin with a single robots fetch", async () => {
      let fetchCalls = 0;
      const robotsTxtContent = `User-agent: *\nAllow: /\n`;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const urlStr = String(input);
        if (urlStr.includes("robots.txt")) {
          fetchCalls++;
          await new Promise((resolve) => setTimeout(resolve, 20));
          return new Response(robotsTxtContent, { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      const promises = [
        isRobotsAllowed("https://fast-origin.com/a"),
        isRobotsAllowed("https://fast-origin.com/b"),
        isRobotsAllowed("https://fast-origin.com/c"),
        isRobotsAllowed("https://fast-origin.com/d"),
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual([true, true, true, true]);
      expect(fetchCalls).toBe(1);
    });
  });

  describe("fetchHtml & fetchAndExtract error & edge case handling", () => {
    it("blocks fetching when robots.txt disallows the target path", async () => {
      const robotsTxt = `User-agent: *\nDisallow: /restricted\n`;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const urlStr = String(input);
        if (urlStr.includes("robots.txt")) {
          return new Response(robotsTxt, { status: 200 });
        }
        return new Response("<html><body>Content</body></html>", { status: 200 });
      });

      await expect(
        fetchHtml("https://blocked-site.com/restricted/article")
      ).rejects.toThrow(/Crawling disallowed by robots\.txt/);

      const extractResult = await fetchAndExtract("https://blocked-site.com/restricted/article");
      expect(extractResult.success).toBe(false);
      expect(extractResult.error).toMatch(/Crawling disallowed by robots\.txt/);
    });

    it("throws a timeout error when request is aborted via AbortError", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const urlStr = String(input);
        if (urlStr.includes("robots.txt")) {
          return new Response("Allow: /", { status: 200 });
        }
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        throw err;
      });

      await expect(
        fetchHtml("https://slow-site.com/page", { timeoutMs: 100 })
      ).rejects.toThrow(/Request timed out after 100ms/);

      const extractResult = await fetchAndExtract("https://slow-site.com/page", { timeoutMs: 100 });
      expect(extractResult.success).toBe(false);
      expect(extractResult.error).toMatch(/Request timed out after 100ms/);
    });

    it("rejects non-HTML content-types (e.g. application/pdf, image/png)", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const urlStr = String(input);
        if (urlStr.includes("robots.txt")) {
          return new Response("Allow: /", { status: 200 });
        }
        return new Response("%PDF-1.4...", {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        });
      });

      await expect(
        fetchHtml("https://example.com/document.pdf")
      ).rejects.toThrow(/Non-HTML content-type received: application\/pdf/);

      const result = await fetchAndExtract("https://example.com/document.pdf");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Non-HTML content-type received/);
    });

    it("correctly follows redirects and captures final URL", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const urlStr = String(input);
        if (urlStr.includes("robots.txt")) {
          return new Response("Allow: /", { status: 200 });
        }
        const resp = new Response("<html><head><title>Redirected Page</title></head><body><h1>Success</h1></body></html>", {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
        Object.defineProperty(resp, "url", { value: "https://example.com/final-landed-url" });
        return resp;
      });

      const result = await fetchHtml("https://example.com/old-url");
      expect(result.finalUrl).toBe("https://example.com/final-landed-url");
      expect(result.statusCode).toBe(200);
      expect(result.html).toContain("Redirected Page");
    });
  });
});
