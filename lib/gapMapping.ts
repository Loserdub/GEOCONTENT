import type {
  PageTopicMap,
  GapCandidate,
  NumericGapScore,
  GapJustification,
  ScoredGap,
  TopicMapEntry,
  GapReport,
} from "@/types";
import { gapScore } from "@/lib/scoring";

// -------------------------------------------------------
// Named constants — adjust these without touching logic
// -------------------------------------------------------

/** Minimum number of pages a topic must appear on to be eligible as a gap candidate */
export const MIN_PAGE_FREQUENCY = 2;

/** Maximum number of candidate gap pairs sent to Pass 1 numeric scoring */
export const MAX_RATIONALE_BATCH_SIZE = 60;

/** Maximum number of scored gaps included in the final report output */
export const MAX_REPORT_GAPS = 20;

/**
 * Builds a cross-page co-occurrence map, identifies gap candidates, and assembles
 * scored gap results from Pass 1 numeric scores and Pass 2 justifications.
 *
 * What it DOES:
 * - Aggregates per-page topic lists into a cross-page topic frequency and word-count map.
 * - Identifies which topic pairs co-occur on at least one shared page (not gaps).
 * - Pre-filters candidates: only topics appearing on MIN_PAGE_FREQUENCY+ pages are eligible.
 * - Computes combined page frequency and combined word count for candidate pairs.
 * - Pre-ranks candidates by combined page frequency before the 60-pair LLM batch cap.
 * - Feeds NumericGapScore results into gapScore() from scoring.ts to produce G and G_amplified.
 * - Attaches Pass 2 justifications to top 20 gaps.
 * - Reports the count of excluded candidates explicitly.
 *
 * What it DOES NOT DO:
 * - Does not make any network requests or LLM calls directly.
 * - Does not reimplement scoring logic — all G calculations go through scoring.ts.
 * - Does not silently drop excluded candidates; the exclusion count is always returned.
 */

// -------------------------------------------------------
// Step 1: Build topic frequency and co-occurrence maps
// -------------------------------------------------------

export interface TopicMetadata {
  type: string;
  pageUrls: Set<string>;
  totalWordCount: number;
}

export function buildTopicFrequencyMap(
  pageMaps: PageTopicMap[],
  pageWordCounts?: Map<string, number>
): Map<string, TopicMetadata> {
  const topicFreq = new Map<string, TopicMetadata>();

  for (const page of pageMaps) {
    const pageWords = pageWordCounts?.get(page.url) ?? 500;
    for (const topic of page.topics) {
      const key = topic.name.toLowerCase().trim();
      if (!topicFreq.has(key)) {
        topicFreq.set(key, {
          type: topic.type,
          pageUrls: new Set(),
          totalWordCount: 0,
        });
      }
      const entry = topicFreq.get(key)!;
      if (!entry.pageUrls.has(page.url)) {
        entry.pageUrls.add(page.url);
        entry.totalWordCount += pageWords;
      }
    }
  }

  return topicFreq;
}

export function buildCoOccurrenceSet(pageMaps: PageTopicMap[]): Set<string> {
  const coOccurring = new Set<string>();

  for (const page of pageMaps) {
    const topicNames = page.topics.map((t) => t.name.toLowerCase().trim());
    for (let i = 0; i < topicNames.length; i++) {
      for (let j = i + 1; j < topicNames.length; j++) {
        // Canonical key: always alphabetically sorted so A|B === B|A
        const key = [topicNames[i], topicNames[j]].sort().join("||");
        coOccurring.add(key);
      }
    }
  }

  return coOccurring;
}

// -------------------------------------------------------
// Step 2: Identify and pre-rank gap candidates
// -------------------------------------------------------

export function identifyGapCandidates(
  pageMaps: PageTopicMap[],
  pageWordCounts?: Map<string, number>
): {
  candidates: GapCandidate[];
  recurringTopics: TopicMapEntry[];
  totalCandidatesFound: number;
  candidatesSentToLLM: number;
  candidatesExcluded: number;
} {
  const topicFreq = buildTopicFrequencyMap(pageMaps, pageWordCounts);
  const coOccurring = buildCoOccurrenceSet(pageMaps);

  // Filter to topics appearing on MIN_PAGE_FREQUENCY+ pages
  const eligibleTopics = Array.from(topicFreq.entries()).filter(
    ([, data]) => data.pageUrls.size >= MIN_PAGE_FREQUENCY
  );

  // Build the recurring topic list for the report
  const recurringTopics: TopicMapEntry[] = eligibleTopics
    .map(([name, data]) => ({
      topic: name,
      type: data.type as TopicMapEntry["type"],
      pageCount: data.pageUrls.size,
      pageUrls: Array.from(data.pageUrls),
    }))
    .sort((a, b) => b.pageCount - a.pageCount);

  // Generate all pairs from eligible topics and filter out co-occurring ones
  const allGapCandidates: GapCandidate[] = [];

  for (let i = 0; i < eligibleTopics.length; i++) {
    for (let j = i + 1; j < eligibleTopics.length; j++) {
      const [nameA, dataA] = eligibleTopics[i];
      const [nameB, dataB] = eligibleTopics[j];
      const pairKey = [nameA, nameB].sort().join("||");

      if (!coOccurring.has(pairKey)) {
        allGapCandidates.push({
          topicA: nameA,
          topicB: nameB,
          pageFreqA: dataA.pageUrls.size,
          pageFreqB: dataB.pageUrls.size,
          wordCountA: dataA.totalWordCount,
          wordCountB: dataB.totalWordCount,
          combinedFreq: dataA.pageUrls.size + dataB.pageUrls.size,
          pagesA: Array.from(dataA.pageUrls),
          pagesB: Array.from(dataB.pageUrls),
        });
      }
    }
  }

  // Sort by combined page frequency descending, then combined word count descending
  allGapCandidates.sort((a, b) => {
    if (b.combinedFreq !== a.combinedFreq) {
      return b.combinedFreq - a.combinedFreq;
    }
    return (b.wordCountA + b.wordCountB) - (a.wordCountA + a.wordCountB);
  });

  const totalCandidatesFound = allGapCandidates.length;
  const candidatesSentToLLM = Math.min(
    totalCandidatesFound,
    MAX_RATIONALE_BATCH_SIZE
  );
  const candidatesExcluded = totalCandidatesFound - candidatesSentToLLM;

  return {
    candidates: allGapCandidates.slice(0, MAX_RATIONALE_BATCH_SIZE),
    recurringTopics,
    totalCandidatesFound,
    candidatesSentToLLM,
    candidatesExcluded,
  };
}

// -------------------------------------------------------
// Step 3: Score gaps using numeric scores + gapScore()
// -------------------------------------------------------

export function scoreGaps(
  candidates: GapCandidate[],
  scores: NumericGapScore[],
  manualTMap?: Map<string, number>
): ScoredGap[] {
  const scored: ScoredGap[] = [];

  // Build lookup map for numeric scores
  const scoreMap = new Map<string, NumericGapScore>();
  for (const s of scores) {
    const key = [s.topicA.toLowerCase().trim(), s.topicB.toLowerCase().trim()]
      .sort()
      .join("||");
    scoreMap.set(key, s);
  }

  for (const candidate of candidates) {
    const key = [candidate.topicA, candidate.topicB].sort().join("||");
    const numScore = scoreMap.get(key);

    if (!numScore) continue;

    const F = Math.max(1, numScore.F);
    const T = manualTMap?.get(key) ?? 0;

    const { G, G_amplified } = gapScore({
      D: numScore.D,
      C: numScore.C,
      S: numScore.S,
      F,
      T,
    });

    scored.push({
      topicA: candidate.topicA,
      topicB: candidate.topicB,
      D: numScore.D,
      C: numScore.C,
      S: numScore.S,
      F,
      T,
      G,
      G_amplified,
      pagesA: candidate.pagesA,
      pagesB: candidate.pagesB,
    });
  }

  // Sort descending by G_amplified
  scored.sort((a, b) => b.G_amplified - a.G_amplified);
  return scored;
}

// -------------------------------------------------------
// Step 4: Attach Pass 2 justifications to top gaps
// -------------------------------------------------------

export function attachJustifications(
  topGaps: ScoredGap[],
  justifications: GapJustification[]
): ScoredGap[] {
  const justMap = new Map<string, GapJustification>();
  for (const j of justifications) {
    const key = [j.topicA.toLowerCase().trim(), j.topicB.toLowerCase().trim()]
      .sort()
      .join("||");
    justMap.set(key, j);
  }

  return topGaps.map((gap) => {
    const key = [gap.topicA, gap.topicB].sort().join("||");
    const just = justMap.get(key);
    if (!just) return gap;

    return {
      ...gap,
      rationale: {
        D: just.D_justification,
        C: just.C_justification,
        S: just.S_justification,
        F: just.F_justification,
        T: gap.T > 0 ? `Time urgency factor T=${gap.T} applied` : "Evergreen (T=0)",
      },
    };
  });
}

// -------------------------------------------------------
// Step 5: Assemble full GapReport
// -------------------------------------------------------

export function assembleGapReport(
  scoredGaps: ScoredGap[],
  topGapsWithJustifications: ScoredGap[],
  totalCandidatesFound: number,
  candidatesSentToLLM: number,
  candidatesExcluded: number,
  recurringTopics: TopicMapEntry[]
): GapReport {
  return {
    recurringTopics,
    totalCandidatesFound,
    candidatesSentToLLM,
    candidatesExcluded,
    scoredGaps,
    topGaps: topGapsWithJustifications.slice(0, MAX_REPORT_GAPS),
  };
}
