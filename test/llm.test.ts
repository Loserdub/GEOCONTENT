import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { batchGapScoringNumeric } from "@/lib/llm/gapScoringNumeric";
import { batchGapJustifications } from "@/lib/llm/gapJustification";
import type { GapCandidate, ScoredGap } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

vi.mock("@google/generative-ai", () => {
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent,
  }));
  const mockGoogleGenerativeAI = vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  }));

  return {
    GoogleGenerativeAI: mockGoogleGenerativeAI,
    mockGenerateContent,
    mockGetGenerativeModel,
  };
});

describe("lib/llm — Gap Scoring & Justification LLM Fallbacks", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-fake-gemini-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const sampleCandidates: GapCandidate[] = [
    {
      topicA: "HYBRID PRODUCTION",
      topicB: "MUSIC PROVENANCE",
      pageFreqA: 2,
      pageFreqB: 2,
      wordCountA: 2000,
      wordCountB: 1500,
      combinedFreq: 4,
      pagesA: ["https://example.com/p1", "https://example.com/p2"],
      pagesB: ["https://example.com/p3", "https://example.com/p4"],
    },
  ];

  const sampleScoredGaps: ScoredGap[] = [
    {
      topicA: "HYBRID PRODUCTION",
      topicB: "MUSIC PROVENANCE",
      D: 8,
      C: 7,
      S: 9,
      F: 2,
      T: 1.0,
      G: 67.5,
      G_amplified: 67.5,
      pagesA: ["https://example.com/p1"],
      pagesB: ["https://example.com/p2"],
    },
  ];

  describe("batchGapScoringNumeric", () => {
    it("returns empty array when candidates array is empty", async () => {
      const scores = await batchGapScoringNumeric([], "context summary");
      expect(scores).toEqual([]);
    });

    it("returns empty array when GEMINI_API_KEY is not set and no customApiKey is provided", async () => {
      delete process.env.GEMINI_API_KEY;
      const scores = await batchGapScoringNumeric(sampleCandidates, "context");
      expect(scores).toEqual([]);
    });

    it("uses customApiKey when passed directly even if process.env.GEMINI_API_KEY is undefined", async () => {
      delete process.env.GEMINI_API_KEY;
      const genAIInstance = new GoogleGenerativeAI("custom-key-123");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify([
              {
                topicA: "HYBRID PRODUCTION",
                topicB: "MUSIC PROVENANCE",
                D: 9,
                C: 8,
                S: 9,
                F: 3,
              },
            ]),
        },
      });

      const scores = await batchGapScoringNumeric(sampleCandidates, "context", "custom-key-123");
      expect(scores).toHaveLength(1);
      expect(scores[0].D).toBe(9);
    });

    it("correctly parses valid JSON response from Gemini", async () => {
      const genAIInstance = new GoogleGenerativeAI("test");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify([
              {
                topicA: "HYBRID PRODUCTION",
                topicB: "MUSIC PROVENANCE",
                D: 8,
                C: 7,
                S: 9,
                F: 2,
              },
            ]),
        },
      });

      const scores = await batchGapScoringNumeric(sampleCandidates, "context");
      expect(scores).toHaveLength(1);
      expect(scores[0]).toEqual({
        topicA: "HYBRID PRODUCTION",
        topicB: "MUSIC PROVENANCE",
        D: 8,
        C: 7,
        S: 9,
        F: 2,
      });
    });

    it("gracefully returns empty array on malformed JSON response rather than throwing", async () => {
      const genAIInstance = new GoogleGenerativeAI("test");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        response: {
          text: () => "Here are your scores: { invalid json: missing brackets",
        },
      });

      const scores = await batchGapScoringNumeric(sampleCandidates, "context");
      expect(scores).toEqual([]);
    });

    it("retries on transient failure and returns empty array if all retries fail", async () => {
      const genAIInstance = new GoogleGenerativeAI("test");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("503 Service Unavailable / Rate Limit")
      );

      const scores = await batchGapScoringNumeric(sampleCandidates, "context");
      expect(scores).toEqual([]);
      // Should have attempted 3 times
      expect(model.generateContent).toHaveBeenCalledTimes(3);
    });
  });

  describe("batchGapJustifications", () => {
    it("returns empty array when topGaps array is empty", async () => {
      const result = await batchGapJustifications([], "context summary");
      expect(result).toEqual([]);
    });

    it("returns empty array when GEMINI_API_KEY is not set and no customApiKey is provided", async () => {
      delete process.env.GEMINI_API_KEY;
      const result = await batchGapJustifications(sampleScoredGaps, "context");
      expect(result).toEqual([]);
    });

    it("uses customApiKey when passed directly even if process.env.GEMINI_API_KEY is undefined", async () => {
      delete process.env.GEMINI_API_KEY;
      const genAIInstance = new GoogleGenerativeAI("custom-just-key");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify([
              {
                topicA: "HYBRID PRODUCTION",
                topicB: "MUSIC PROVENANCE",
                D_justification: "Strong ecosystem synergy.",
                C_justification: "High citation potential.",
                S_justification: "Active search demand.",
                F_justification: "Requires moderate technical research.",
              },
            ]),
        },
      });

      const justifications = await batchGapJustifications(sampleScoredGaps, "context", "custom-just-key");
      expect(justifications).toHaveLength(1);
      expect(justifications[0].D_justification).toBe("Strong ecosystem synergy.");
    });

    it("correctly parses valid prose justifications from Gemini", async () => {
      const genAIInstance = new GoogleGenerativeAI("test");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify([
              {
                topicA: "HYBRID PRODUCTION",
                topicB: "MUSIC PROVENANCE",
                D_justification: "Strong ecosystem synergy.",
                C_justification: "High citation potential.",
                S_justification: "Active search demand.",
                F_justification: "Requires moderate technical research.",
              },
            ]),
        },
      });

      const justifications = await batchGapJustifications(sampleScoredGaps, "context");
      expect(justifications).toHaveLength(1);
      expect(justifications[0].D_justification).toBe("Strong ecosystem synergy.");
    });

    it("gracefully returns empty array on malformed JSON response rather than throwing", async () => {
      const genAIInstance = new GoogleGenerativeAI("test");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        response: {
          text: () => "I am unable to generate prose justification at this moment.",
        },
      });

      const justifications = await batchGapJustifications(sampleScoredGaps, "context");
      expect(justifications).toEqual([]);
    });

    it("retries on transient failure and returns empty array if all retries fail", async () => {
      const genAIInstance = new GoogleGenerativeAI("test");
      const model = genAIInstance.getGenerativeModel({ model: "gemini-3.6-flash" });
      (model.generateContent as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("500 Internal Gemini Error")
      );

      const justifications = await batchGapJustifications(sampleScoredGaps, "context");
      expect(justifications).toEqual([]);
      expect(model.generateContent).toHaveBeenCalledTimes(3);
    });
  });
});
