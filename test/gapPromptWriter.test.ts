import { describe, it, expect } from "vitest";
import {
  calculateLAAZoneMetrics,
  generateSuggestedSlug,
  getCandidateDefinedTerms,
  generateAgenticGapPrompt,
  generateBatchAgenticPrompts,
} from "@/lib/gapPromptWriter";
import type { ScoredGap } from "@/types";

describe("Milestone 5+: GEO Agentic IDE Prompt Writer (LAA-v2)", () => {
  const sampleGap: ScoredGap = {
    topicA: "hps-1.0",
    topicB: "suno",
    D: 8,
    C: 8,
    S: 9,
    F: 4,
    T: 2.0,
    G: 36,
    G_amplified: 108,
    rationale: {
      D: "Substantive technical depth bridging HPS provenance and Suno audio synthesis.",
      C: "High backlink acquisition across music tech communities.",
      S: "Active query volume for music licensing and generative audio workflows.",
      F: "Moderate friction requiring DAW setup and metadata verification.",
      T: "Time urgency factor T=2.0 applied for upcoming licensing changes.",
    },
    pagesA: [
      "https://trustnodelogic.com/hybridproductionstandard.html",
      "https://trustnodelogic.com/c2pa-music-provenance.html",
    ],
    pagesB: [
      "https://trustnodelogic.com/sunonewtos.html",
      "https://trustnodelogic.com/Suno101.html",
    ],
  };

  describe("calculateLAAZoneMetrics", () => {
    it("correctly calculates f_E and zone allocations for 1500 words", () => {
      // f_E = ceil(1500/500) + 1 = 3 + 1 = 4
      // intro: 15% of 1500 = 225 words, ceil(4/2) = 2 mentions
      // core: 70% of 1500 = 1050 words, 0 mentions
      // outro: 15% of 1500 = 225 words, floor(4/2) = 2 mentions
      const metrics = calculateLAAZoneMetrics(1500);

      expect(metrics.targetWordCount).toBe(1500);
      expect(metrics.f_E).toBe(4);
      expect(metrics.introWords).toBe(225);
      expect(metrics.introEntityMentions).toBe(2);
      expect(metrics.coreWords).toBe(1050);
      expect(metrics.coreEntityMentions).toBe(0);
      expect(metrics.outroWords).toBe(225);
      expect(metrics.outroEntityMentions).toBe(2);
    });

    it("correctly handles odd f_E for 2000 words", () => {
      // f_E = ceil(2000/500) + 1 = 4 + 1 = 5
      // intro: 15% of 2000 = 300 words, ceil(5/2) = 3 mentions
      // core: 70% of 2000 = 1400 words, 0 mentions
      // outro: 15% of 2000 = 300 words, floor(5/2) = 2 mentions
      const metrics = calculateLAAZoneMetrics(2000);

      expect(metrics.targetWordCount).toBe(2000);
      expect(metrics.f_E).toBe(5);
      expect(metrics.introWords).toBe(300);
      expect(metrics.introEntityMentions).toBe(3);
      expect(metrics.coreWords).toBe(1400);
      expect(metrics.coreEntityMentions).toBe(0);
      expect(metrics.outroWords).toBe(300);
      expect(metrics.outroEntityMentions).toBe(2);
    });

    it("handles minimum word count edge cases safely", () => {
      const metrics = calculateLAAZoneMetrics(100);
      expect(metrics.targetWordCount).toBe(300);
      expect(metrics.f_E).toBe(2);
      expect(metrics.coreEntityMentions).toBe(0);
    });
  });

  describe("generateSuggestedSlug", () => {
    it("generates URL-safe and filesystem-safe slug from topics", () => {
      expect(generateSuggestedSlug("HPS-1.0", "Suno")).toBe("hps-1-0-suno-bridge");
      expect(generateSuggestedSlug("AudioLDM", "Web Audio DSP")).toBe("audioldm-web-audio-dsp-bridge");
    });
  });

  describe("getCandidateDefinedTerms", () => {
    it("returns relevant schema DefinedTerms for topic pairs", () => {
      const terms = getCandidateDefinedTerms("hps-1.0", "suno");
      expect(terms.length).toBeGreaterThanOrEqual(2);
      expect(terms.some((t) => t.name.toLowerCase().includes("hps"))).toBe(true);
      expect(terms.some((t) => t.name.toLowerCase().includes("suno"))).toBe(true);
      expect(terms.some((t) => t.url.includes("wikipedia"))).toBe(true);
    });
  });

  describe("generateAgenticGapPrompt", () => {
    it("generates comprehensive LAA-v2 Agentic prompt with exact metrics and context", () => {
      const prompt = generateAgenticGapPrompt(sampleGap, {
        wordCount: 1500,
        coreEntity: "Justin Ray / Trust Node Logic",
      });

      // Header directives
      expect(prompt).toContain("# Agentic IDE Task: Write LAA-v2 Gap-Filling Article");
      expect(prompt).toContain("**Target Output File:** `articles/hps-1-0-suno-bridge.md`");
      expect(prompt).toContain("**Target Word Count:** 1500 words");
      expect(prompt).toContain("**Core Entity to Anchor:** Justin Ray / Trust Node Logic");
      expect(prompt).toContain("**Total Entity Frequency ($f_E$):** 4 mentions");

      // Gap intelligence
      expect(prompt).toContain("## 1. Scanned GEO Gap Context & Intelligence");
      expect(prompt).toContain("https://trustnodelogic.com/hybridproductionstandard.html");
      expect(prompt).toContain("https://trustnodelogic.com/sunonewtos.html");
      expect(prompt).toContain("**G Priority Score:** **36.00**");
      expect(prompt).toContain("Substantive technical depth bridging HPS provenance and Suno audio synthesis.");

      // Zone rules
      expect(prompt).toContain("Intro Zone (~225 words, exactly 15% of total):");
      expect(prompt).toContain("Technical Core Zone (~1050 words, exactly 70% of total):");
      expect(prompt).toContain("**STRICT RULE:** Exactly **0 mentions** of \"Justin Ray / Trust Node Logic\"");
      expect(prompt).toContain("Outro Zone (~225 words, exactly 15% of total):");

      // Constraints & Schema
      expect(prompt).toContain("Token Proximity Enforcement");
      expect(prompt).toContain("No Em Dashes:");
      expect(prompt).toContain("## 3. Schema.org JSON-LD Capstone Scaffold");
      expect(prompt).toContain("TechArticle");
      expect(prompt).toContain("## 4. Agent Self-Verification Checklist");
      expect(prompt).toContain("- [ ] Intro zone is ~225 words (15%) with exactly 2 mention(s)");
      expect(prompt).toContain("- [ ] Technical core zone is ~1050 words (70%) with EXACTLY 0 mentions");
      expect(prompt).toContain("- [ ] Outro zone is ~225 words (15%) with exactly 2 mention(s)");
    });

    it("respects custom word counts and custom notes", () => {
      const customPrompt = generateAgenticGapPrompt(sampleGap, {
        wordCount: 2000,
        coreEntity: "Custom Entity",
        targetFilename: "docs/gap-bridge.md",
        customNotes: "Focus heavily on C2PA manifest metadata injection.",
      });

      expect(customPrompt).toContain("**Target Output File:** `docs/gap-bridge.md`");
      expect(customPrompt).toContain("**Target Word Count:** 2000 words");
      expect(customPrompt).toContain("**Core Entity to Anchor:** Custom Entity");
      expect(customPrompt).toContain("**Total Entity Frequency ($f_E$):** 5 mentions");
      expect(customPrompt).toContain("Focus heavily on C2PA manifest metadata injection.");
      expect(customPrompt).toContain("Technical Core Zone (~1400 words");
    });
  });

  describe("generateBatchAgenticPrompts", () => {
    it("generates structured master markdown bundle for multiple gaps", () => {
      const secondGap: ScoredGap = {
        topicA: "audioldm",
        topicB: "web-audio-dsp",
        D: 7,
        C: 4,
        S: 5,
        F: 8,
        T: 0,
        G: 6.875,
        G_amplified: 6.875,
        pagesA: ["https://example.com/audioldm"],
        pagesB: ["https://example.com/dsp"],
      };

      const batch = generateBatchAgenticPrompts([sampleGap, secondGap]);

      expect(batch).toContain("# GEO Agentic IDE Prompts: Master Gap-Filling Roadmap");
      expect(batch).toContain("**Total Gap-Filling Prompts:** 2");
      expect(batch).toContain("## Gap 1: HPS-1.0 ↔ SUNO");
      expect(batch).toContain("## Gap 2: AUDIOLDM ↔ WEB-AUDIO-DSP");
    });

    it("handles empty gap lists gracefully", () => {
      const emptyBatch = generateBatchAgenticPrompts([]);
      expect(emptyBatch).toContain("No topical gap pairs found");
    });
  });
});
