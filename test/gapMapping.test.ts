import { describe, it, expect } from "vitest";
import {
  buildTopicFrequencyMap,
  buildCoOccurrenceSet,
  identifyGapCandidates,
  scoreGaps,
  attachJustifications,
  assembleGapReport,
  MIN_PAGE_FREQUENCY,
  MAX_RATIONALE_BATCH_SIZE,
  MAX_REPORT_GAPS,
} from "@/lib/gapMapping";
import type { PageTopicMap, NumericGapScore, GapJustification } from "@/types";

describe("Milestone 4: Gap Mapping & Two-Pass Pipeline", () => {
  const samplePages: PageTopicMap[] = [
    {
      url: "https://example.com/page1",
      title: "HPS-1.0 and Suno Workflows",
      topics: [
        { name: "HPS-1.0", type: "technology", mentions: 5 },
        { name: "Suno", type: "technology", mentions: 8 },
        { name: "Audio Engineering", type: "concept", mentions: 3 },
      ],
    },
    {
      url: "https://example.com/page2",
      title: "Suno Commercial Rights & Licensing",
      topics: [
        { name: "Suno", type: "technology", mentions: 6 },
        { name: "Music Licensing", type: "concept", mentions: 4 },
        { name: "Audio Engineering", type: "concept", mentions: 2 },
      ],
    },
    {
      url: "https://example.com/page3",
      title: "AudioLDM and DSP",
      topics: [
        { name: "AudioLDM", type: "technology", mentions: 4 },
        { name: "Audio Engineering", type: "concept", mentions: 5 },
        { name: "Web Audio DSP", type: "technology", mentions: 3 },
      ],
    },
    {
      url: "https://example.com/page4",
      title: "Music Licensing in Generative AI",
      topics: [
        { name: "Music Licensing", type: "concept", mentions: 5 },
        { name: "HPS-1.0", type: "technology", mentions: 3 },
      ],
    },
  ];

  const wordCounts = new Map<string, number>([
    ["https://example.com/page1", 1500],
    ["https://example.com/page2", 2000],
    ["https://example.com/page3", 1200],
    ["https://example.com/page4", 800],
  ]);

  describe("Constants", () => {
    it("has expected tuned values", () => {
      expect(MIN_PAGE_FREQUENCY).toBe(2);
      expect(MAX_RATIONALE_BATCH_SIZE).toBe(60);
      expect(MAX_REPORT_GAPS).toBe(20);
    });
  });

  describe("buildTopicFrequencyMap()", () => {
    it("aggregates topics, tracks page URLs and total word counts correctly", () => {
      const map = buildTopicFrequencyMap(samplePages, wordCounts);
      expect(map.get("suno")?.pageUrls.size).toBe(2);
      expect(map.get("suno")?.totalWordCount).toBe(3500); // 1500 + 2000
      expect(map.get("audio engineering")?.pageUrls.size).toBe(3);
      expect(map.get("audio engineering")?.totalWordCount).toBe(4700); // 1500 + 2000 + 1200
      expect(map.get("audioldm")?.pageUrls.size).toBe(1);
      expect(map.get("hps-1.0")?.pageUrls.size).toBe(2);
      expect(map.get("hps-1.0")?.totalWordCount).toBe(2300); // 1500 + 800
    });
  });

  describe("buildCoOccurrenceSet()", () => {
    it("identifies pairs that appear together on any single page", () => {
      const coOccurring = buildCoOccurrenceSet(samplePages);
      expect(coOccurring.has(["hps-1.0", "suno"].sort().join("||"))).toBe(true);
      expect(coOccurring.has(["audio engineering", "suno"].sort().join("||"))).toBe(true);
      expect(coOccurring.has(["audioldm", "suno"].sort().join("||"))).toBe(false);
    });
  });

  describe("identifyGapCandidates()", () => {
    it("identifies candidate gaps with combined frequency and word counts", () => {
      const testPages: PageTopicMap[] = [
        {
          url: "https://example.com/p1",
          title: "Topic A and B",
          topics: [
            { name: "Topic A", type: "concept", mentions: 1 },
            { name: "Topic B", type: "concept", mentions: 1 },
          ],
        },
        {
          url: "https://example.com/p2",
          title: "Topic A and C",
          topics: [
            { name: "Topic A", type: "concept", mentions: 1 },
            { name: "Topic C", type: "concept", mentions: 1 },
          ],
        },
        {
          url: "https://example.com/p3",
          title: "Topic B and D",
          topics: [
            { name: "Topic B", type: "concept", mentions: 1 },
            { name: "Topic D", type: "concept", mentions: 1 },
          ],
        },
        {
          url: "https://example.com/p4",
          title: "Topic C and D",
          topics: [
            { name: "Topic C", type: "concept", mentions: 1 },
            { name: "Topic D", type: "concept", mentions: 1 },
          ],
        },
      ];

      const testWords = new Map([
        ["https://example.com/p1", 1000],
        ["https://example.com/p2", 1500],
        ["https://example.com/p3", 800],
        ["https://example.com/p4", 1200],
      ]);

      const result = identifyGapCandidates(testPages, testWords);
      expect(result.recurringTopics.length).toBe(4);
      expect(result.totalCandidatesFound).toBe(2);
      expect(result.candidates.length).toBe(2);
      expect(result.candidatesExcluded).toBe(0);

      const candidateAD = result.candidates.find(
        (c) => [c.topicA, c.topicB].sort().join("||") === ["topic a", "topic d"].sort().join("||")
      );
      expect(candidateAD).toBeDefined();
      expect(candidateAD?.wordCountA).toBe(2500); // p1 (1000) + p2 (1500)
      expect(candidateAD?.wordCountB).toBe(2000); // p3 (800) + p4 (1200)
    });
  });

  describe("scoreGaps() and attachJustifications()", () => {
    it("runs Pass 1 numeric scoring and Pass 2 justification attachment", () => {
      const candidates = [
        {
          topicA: "topic a",
          topicB: "topic d",
          pageFreqA: 2,
          pageFreqB: 2,
          wordCountA: 2500,
          wordCountB: 2000,
          combinedFreq: 4,
          pagesA: ["p1", "p2"],
          pagesB: ["p3", "p4"],
        },
        {
          topicA: "topic b",
          topicB: "topic c",
          pageFreqA: 2,
          pageFreqB: 2,
          wordCountA: 1800,
          wordCountB: 2700,
          combinedFreq: 4,
          pagesA: ["p1", "p3"],
          pagesB: ["p2", "p4"],
        },
      ];

      // Pass 1: Numeric-only scores
      const numericScores: NumericGapScore[] = [
        { topicA: "topic a", topicB: "topic d", D: 8, C: 8, S: 9, F: 4 },
        { topicA: "topic b", topicB: "topic c", D: 7, C: 4, S: 5, F: 8 },
      ];

      const scored = scoreGaps(candidates, numericScores);
      expect(scored.length).toBe(2);

      // (8+8)*9/4 = 36
      expect(scored[0].topicA).toBe("topic a");
      expect(scored[0].G).toBe(36);
      expect(scored[0].G_amplified).toBe(36);

      // (7+4)*5/8 = 6.875
      expect(scored[1].topicA).toBe("topic b");
      expect(scored[1].G).toBe(6.875);

      // Pass 2: Prose justifications for top results
      const justifications: GapJustification[] = [
        {
          topicA: "topic a",
          topicB: "topic d",
          D_justification: "Comprehensive coverage exists across both domains.",
          C_justification: "Strong external backlink potential from tech blogs.",
          S_justification: "High query intent and search demand.",
          F_justification: "Moderate authoring friction requiring testing.",
        },
      ];

      const topWithJust = attachJustifications(scored.slice(0, 1), justifications);
      expect(topWithJust[0].rationale?.D).toBe("Comprehensive coverage exists across both domains.");
      expect(topWithJust[0].rationale?.C).toBe("Strong external backlink potential from tech blogs.");

      // Assemble full report
      const report = assembleGapReport(
        scored,
        topWithJust,
        2,
        2,
        0,
        []
      );

      expect(report.totalCandidatesFound).toBe(2);
      expect(report.candidatesSentToLLM).toBe(2);
      expect(report.candidatesExcluded).toBe(0);
      expect(report.scoredGaps.length).toBe(2);
      expect(report.topGaps.length).toBe(1);
      expect(report.topGaps[0].G_amplified).toBe(36);
    });
  });
});
