import { describe, it, expect } from "vitest";
import { extractPageContent } from "@/lib/extract";

describe("Content Extraction (M1)", () => {
  it("extracts metadata, headings, JSON-LD, and clean body text from HTML sample", () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>GEO Optimization Guide | Trust Node Logic</title>
        <meta name="description" content="A comprehensive guide to Generative Engine Optimization tactics and scorecards." />
        <meta property="og:description" content="A comprehensive guide to Generative Engine Optimization tactics and scorecards." />
        <meta name="twitter:description" content="A comprehensive guide to Generative Engine Optimization tactics and scorecards." />
        <link rel="canonical" href="https://trustnodelogic.com/geo-guide" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "GEO Optimization Guide",
          "author": {
            "@type": "Person",
            "name": "Justin Tyler Ray"
          }
        }
        </script>
      </head>
      <body>
        <nav><a href="/">Home</a><a href="/about">About</a></nav>
        <main>
          <h1>Understanding Generative Engine Optimization</h1>
          <p>Generative Engine Optimization (GEO) is the practice of optimizing digital content for visibility in generative AI search experiences. This paradigm shifts focus from traditional keyword density to authoritative knowledge grounding.</p>
          <h2>Key Statistical Benchmarks</h2>
          <p>Recent studies demonstrate that adding verified citations increases visibility by 35% across major LLM engines according to research benchmarks.</p>
          <p>For more technical details, check out <a href="https://en.wikipedia.org/wiki/Search_engine_optimization">Wikipedia SEO Overview</a> and <a href="https://arxiv.org/abs/2311.09735">Aggarwal et al. Arxiv paper</a>.</p>
        </main>
        <footer>
          <p>&copy; 2026 Trust Node Logic. All rights reserved.</p>
        </footer>
      </body>
      </html>
    `;

    const result = extractPageContent(sampleHtml, "https://trustnodelogic.com/geo-guide");

    expect(result.title).toBe("GEO Optimization Guide | Trust Node Logic");
    expect(result.metaDescription).toBe("A comprehensive guide to Generative Engine Optimization tactics and scorecards.");
    expect(result.canonicalUrl).toBe("https://trustnodelogic.com/geo-guide");
    expect(result.headings).toEqual([
      { level: 1, text: "Understanding Generative Engine Optimization" },
      { level: 2, text: "Key Statistical Benchmarks" },
    ]);
    expect(result.wordCount).toBeGreaterThan(40);
    expect(result.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(result.jsonLd.length).toBe(1);
    expect(result.jsonLd[0]["@type"]).toBe("Article");
    expect(result.outboundLinks.length).toBe(2);
    expect(result.outboundLinks[0].domain).toBe("en.wikipedia.org");
    expect(result.outboundLinks[1].domain).toBe("arxiv.org");
  });

  it("handles malformed JSON-LD gracefully without crashing", () => {
    const brokenHtml = `
      <html>
        <head>
          <script type="application/ld+json">{ broken json </script>
        </head>
        <body>
          <p>Simple content test paragraph.</p>
        </body>
      </html>
    `;
    const result = extractPageContent(brokenHtml, "https://example.com/broken-json");
    expect(result.jsonLd.length).toBe(1);
    expect(result.jsonLd[0]._parseError).toBe(true);
    expect(result.wordCount).toBeGreaterThan(0);
  });
});
