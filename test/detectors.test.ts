import { describe, it, expect } from "vitest";
import {
  checkCitations,
  checkQuotations,
  checkStatistics,
  checkKeywordStuffing,
  validateSchema,
  checkMetaDescription,
  checkStructure,
  analyzePage,
} from "@/lib/detectors";
import type { ExtractedContent } from "@/types";

describe("Milestone 2 Detectors", () => {
  const createMockContent = (overrides?: Partial<ExtractedContent>): ExtractedContent => ({
    url: "https://trustnodelogic.com/test-page",
    canonicalUrl: "https://trustnodelogic.com/test-page",
    title: "Understanding Hybrid Production Workflows",
    metaDescription: "A comprehensive analysis of hybrid generative workflows and algorithmic sound design strategies for modern audio producers.",
    ogDescription: "A comprehensive analysis of hybrid generative workflows and algorithmic sound design strategies for modern audio producers.",
    twitterDescription: "A comprehensive analysis of hybrid generative workflows and algorithmic sound design strategies for modern audio producers.",
    headings: [
      { level: 1, text: "Understanding Hybrid Production Workflows" },
      { level: 2, text: "Empirical Studies and Citations" },
      { level: 2, text: "Industry Perspectives" },
    ],
    bodyText: 'Understanding Hybrid Production Workflows introduces how digital signal processing and machine learning blend together. "Hybrid production is about finding the soul inside the algorithm," explains the author. According to research from arxiv.org, adding verified citations increases visibility by 35% across engines in 2024. Therefore, sound engineers can build scalable sound design frameworks.',
    wordCount: 55,
    paragraphs: [
      "Understanding Hybrid Production Workflows introduces how digital signal processing and machine learning blend together.",
      '"Hybrid production is about finding the soul inside the algorithm," explains the author.',
      "According to research from arxiv.org, adding verified citations increases visibility by 35% across engines in 2024.",
      "Therefore, sound engineers can build scalable sound design frameworks.",
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": "Understanding Hybrid Production Workflows",
        "sameAs": ["https://en.wikipedia.org/wiki/Hybrid_production"],
      },
    ],
    outboundLinks: [
      { href: "https://arxiv.org/abs/2311.09735", text: "Arxiv Research Paper", domain: "arxiv.org" },
      { href: "https://en.wikipedia.org/wiki/Audio_signal_processing", text: "Wikipedia Audio DSP", domain: "en.wikipedia.org" },
    ],
    ...overrides,
  });

  describe("Citations Detector (citeSources.ts)", () => {
    it("passes and extracts high-authority domain links and in-text citations", () => {
      const content = createMockContent();
      const result = checkCitations(content);
      expect(result.passed).toBe(true);
      expect(result.highAuthorityCount).toBe(2);
      expect(result.inTextCitationCount).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.source === "arxiv.org")).toBe(true);
    });

    it("counts distinct third-party domains as a weak citation signal", () => {
      const content = createMockContent({
        outboundLinks: [
          { href: "https://some-niche-trade-journal.org/article", text: "Trade Journal", domain: "some-niche-trade-journal.org" },
          { href: "https://industry-blog.com/post", text: "Industry Blog", domain: "industry-blog.com" },
        ],
        paragraphs: ["Just some text without in-text citation patterns."],
        bodyText: "Just some text without in-text citation patterns.",
      });
      const result = checkCitations(content);
      expect(result.passed).toBe(false); // third-party alone doesn't pass
      expect(result.thirdPartyCount).toBe(2);
      expect(result.findings.filter((f) => f.type === "third_party_reference").length).toBe(2);
      expect(result.summary).toContain("third-party reference");
    });

    it("excludes social/CDN domains from third-party count", () => {
      const content = createMockContent({
        outboundLinks: [
          { href: "https://twitter.com/someone", text: "Twitter", domain: "twitter.com" },
          { href: "https://youtube.com/watch", text: "YouTube", domain: "youtube.com" },
        ],
        paragraphs: ["Plain text."],
        bodyText: "Plain text.",
      });
      const result = checkCitations(content);
      expect(result.thirdPartyCount).toBe(0);
    });

    it("promotes custom domains to high-authority tier via options", () => {
      const content = createMockContent({
        outboundLinks: [
          { href: "https://musicbrainz.org/artist/123", text: "MusicBrainz", domain: "musicbrainz.org" },
        ],
        paragraphs: ["Plain text."],
        bodyText: "Plain text.",
      });
      // Without custom domains: musicbrainz.org is just a third-party reference
      const withoutCustom = checkCitations(content);
      expect(withoutCustom.highAuthorityCount).toBe(0);
      expect(withoutCustom.thirdPartyCount).toBe(1);

      // With custom domains: musicbrainz.org becomes high-authority
      const withCustom = checkCitations(content, { customAuthorityDomains: ["musicbrainz.org"] });
      expect(withCustom.highAuthorityCount).toBe(1);
      expect(withCustom.thirdPartyCount).toBe(0);
      expect(withCustom.passed).toBe(true);
    });

    it("fails when no citations or high authority links exist", () => {
      const content = createMockContent({
        outboundLinks: [],
        paragraphs: ["Just some generic text without any citation patterns."],
        bodyText: "Just some generic text without any citation patterns.",
      });
      const result = checkCitations(content);
      expect(result.passed).toBe(false);
      expect(result.highAuthorityCount).toBe(0);
      expect(result.thirdPartyCount).toBe(0);
    });
  });

  describe("Quotations Detector (quotations.ts)", () => {
    it("detects attributed quotations with indicator verbs", () => {
      const content = createMockContent();
      const result = checkQuotations(content);
      expect(result.passed).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].quote).toContain("Hybrid production is about finding the soul");
      expect(result.findings[0].attribution).toContain("explains");
    });

    it("fails when no quotes are present", () => {
      const content = createMockContent({
        paragraphs: ["No quotes here at all, just plain expository text."],
      });
      const result = checkQuotations(content);
      expect(result.passed).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe("Statistics Detector (statistics.ts)", () => {
    it("detects percentages, dated points, and metrics", () => {
      const content = createMockContent();
      const result = checkStatistics(content);
      expect(result.passed).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(2);
      expect(result.findings.some((f) => f.category === "percentage")).toBe(true);
      expect(result.findings.some((f) => f.category === "dated_point")).toBe(true);
    });
  });

  describe("Keyword Stuffing Detector (keywordStuffing.ts)", () => {
    it("flags excessive density in large articles", () => {
      const repeatedText = "audio processing ".repeat(20) + "standard text with normal distribution of varied words in length ".repeat(10);
      const content = createMockContent({
        bodyText: repeatedText,
        wordCount: 180,
      });
      const result = checkKeywordStuffing(content, 2.5);
      expect(result.isStuffed).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.flaggedKeywords.length).toBeGreaterThan(0);
    });

    it("passes clean content with natural term frequency", () => {
      const content = createMockContent();
      const result = checkKeywordStuffing(content);
      expect(result.passed).toBe(true);
      expect(result.isStuffed).toBe(false);
    });
  });

  describe("Schema Validation Detector (schemaValidation.ts)", () => {
    it("passes valid JSON-LD schemas with proper @type and valid sameAs URLs", () => {
      const content = createMockContent();
      const result = validateSchema(content);
      expect(result.passed).toBe(true);
      expect(result.typesFound).toContain("TechArticle");
      expect(result.hasParseErrors).toBe(false);
      expect(result.sameAsUrls).toContain("https://en.wikipedia.org/wiki/Hybrid_production");
    });

    it("explicitly flags _parseError blocks from M1 as schema validation failures", () => {
      const content = createMockContent({
        jsonLd: [
          { _parseError: true, rawContent: '{"@context": "broken json without closing' },
          { "@context": "https://schema.org", "@type": "Person", "name": "Justin Ray" },
        ],
      });
      const result = validateSchema(content);
      expect(result.passed).toBe(false);
      expect(result.hasParseErrors).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Malformed JSON syntax");
      expect(result.reports[0].validJson).toBe(false);
    });
  });

  describe("Meta Description Detector (metaDescription.ts)", () => {
    it("passes when description is in the 120-155 character range and consistent", () => {
      const content = createMockContent();
      const result = checkMetaDescription(content);
      expect(result.passed).toBe(true);
      expect(result.inOptimalRange).toBe(true);
      expect(result.lengthStatus).toBe("optimal");
      expect(result.isConsistent).toBe(true);
    });

    it("flags too short or missing meta descriptions", () => {
      const content = createMockContent({ metaDescription: "Short text" });
      const result = checkMetaDescription(content);
      expect(result.passed).toBe(false);
      expect(result.lengthStatus).toBe("too_short");
    });
  });

  describe("Structural Checks (structuralChecks.ts)", () => {
    it("evaluates abstract paragraph, zone distribution, and transitions", () => {
      const content = createMockContent();
      const result = checkStructure(content);
      expect(result.semanticAbstract.passed).toBe(true);
      expect(result.logicalChain.transitionCount).toBeGreaterThanOrEqual(1);
      expect(result.logicalChain.transitionsFound).toContain("therefore");
    });
  });

  describe("Aggregated Page Analysis (analyzePage)", () => {
    it("assembles complete PageScorecard with all detector findings", () => {
      const content = createMockContent();
      const scorecard = analyzePage(content);
      expect(scorecard.url).toBe(content.url);
      expect(scorecard.tactics.citeSources.passed).toBe(true);
      expect(scorecard.tactics.quotations.passed).toBe(true);
      expect(scorecard.tactics.statistics.passed).toBe(true);
      expect(scorecard.structural.schemaValidation.passed).toBe(true);
      expect(scorecard.structural.metaDescription.passed).toBe(true);
      expect(scorecard.tactics.fluencyAuthoritativeTone?.status).toBe("deferred");
    });

    it("forwards customAuthorityDomains to checkCitations via options", () => {
      const content = createMockContent({
        outboundLinks: [
          { href: "https://custom-trade-publication.com/spec", text: "Custom Spec", domain: "custom-trade-publication.com" },
        ],
        paragraphs: ["Plain text without standard citations."],
      });

      // Default: treated as third_party_reference
      const defaultScorecard = analyzePage(content);
      expect(defaultScorecard.tactics.citeSources.highAuthorityCount).toBe(0);
      expect(defaultScorecard.tactics.citeSources.thirdPartyCount).toBe(1);

      // With customAuthorityDomains: promoted to highAuthority
      const customScorecard = analyzePage(content, {
        customAuthorityDomains: ["custom-trade-publication.com"],
      });
      expect(customScorecard.tactics.citeSources.highAuthorityCount).toBe(1);
      expect(customScorecard.tactics.citeSources.thirdPartyCount).toBe(0);
      expect(customScorecard.tactics.citeSources.passed).toBe(true);
    });
  });
});

