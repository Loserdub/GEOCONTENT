import type {
  ExtractedContent,
  StructuralCheckResult,
  SemanticAbstractResult,
  ZoneDistributionResult,
  LogicalChainResult,
} from "@/types";

const TRANSITION_PHRASES = [
  "therefore",
  "this means",
  "as a result",
  "consequently",
  "furthermore",
  "in addition",
  "in contrast",
  "however",
  "for example",
  "for instance",
  "specifically",
  "on the other hand",
  "in other words",
  "accordingly",
];

/**
 * Checks structural layout: opening abstract paragraph, keyword zone distribution, and transition chains.
 *
 * What it DOES:
 * - Evaluates whether the opening paragraph introduces the core topic / title entities within a ~250 word concise abstract.
 * - Measures the distribution of core subject keywords across the Intro (first 15%), Body (middle 70%), and Conclusion (last 15%).
 * - Counts logical transition markers linking conceptual sections (reported as informational).
 * - Returns structured results for abstract quality, zone distribution, and transition counts.
 *
 * What it DOES NOT DO:
 * - Does not penalize zone distribution or transition counts in overall pass/fail scoring (they are informational disciplines).
 * - Does not use external LLM calls to grade argumentative quality.
 */
export function checkStructure(content: ExtractedContent): StructuralCheckResult {
  // 1. Semantic Abstract Check
  const firstParagraph = content.paragraphs[0] || "";
  const firstParaWords = firstParagraph.split(/\s+/).filter((w) => w.length > 0);
  const openingWordCount = firstParaWords.length;

  // Extract core entity candidate from title or H1
  let coreEntityCandidate = "";
  if (content.title) {
    coreEntityCandidate = content.title.split(/[|·\-—:]/)[0].trim();
  } else if (content.headings.length > 0 && content.headings[0].level === 1) {
    coreEntityCandidate = content.headings[0].text;
  }

  // Check if first paragraph mentions key title tokens
  const titleTokens = coreEntityCandidate
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);

  const firstParaLower = firstParagraph.toLowerCase();
  const matchedTokens = titleTokens.filter((token) => firstParaLower.includes(token));
  const containsEntity = matchedTokens.length > 0 || (titleTokens.length === 0 && openingWordCount > 20);

  // Ideal abstract paragraph is concise and introduces core entity (~250 words)
  const isOptimalAbstractLength = openingWordCount >= 10 && openingWordCount <= 300;
  const abstractPassed = containsEntity && isOptimalAbstractLength;

  const semanticAbstract: SemanticAbstractResult = {
    passed: abstractPassed,
    openingWordCount,
    detectedTopicOrEntity: coreEntityCandidate || "Primary Subject",
    containsEntity,
    summary: abstractPassed
      ? `Passed. Opening paragraph (${openingWordCount} words) establishes the core entity ("${coreEntityCandidate || "Topic"}").`
      : `Failed. Opening paragraph (${openingWordCount} words) does not clearly introduce the primary entity or is outside the ~250 word abstract scope.`,
  };

  // 2. Zone Distribution Check (First 15% / Middle 70% / Last 15%)
  const bodyTextLower = content.bodyText.toLowerCase();
  const totalChars = bodyTextLower.length;
  let introZoneCount = 0;
  let bodyZoneCount = 0;
  let conclusionZoneCount = 0;

  if (totalChars > 0 && titleTokens.length > 0) {
    const introBoundary = Math.floor(totalChars * 0.15);
    const conclusionBoundary = Math.floor(totalChars * 0.85);

    const introSlice = bodyTextLower.slice(0, introBoundary);
    const bodySlice = bodyTextLower.slice(introBoundary, conclusionBoundary);
    const conclusionSlice = bodyTextLower.slice(conclusionBoundary);

    for (const token of titleTokens) {
      const introMatches = (introSlice.match(new RegExp(`\\b${token}\\b`, "g")) || []).length;
      const bodyMatches = (bodySlice.match(new RegExp(`\\b${token}\\b`, "g")) || []).length;
      const conclusionMatches = (conclusionSlice.match(new RegExp(`\\b${token}\\b`, "g")) || []).length;

      introZoneCount += introMatches;
      bodyZoneCount += bodyMatches;
      conclusionZoneCount += conclusionMatches;
    }
  }

  const zoneDistribution: ZoneDistributionResult = {
    introZoneCount,
    bodyZoneCount,
    conclusionZoneCount,
    summary: `Informational: Core topic mentions distributed across Intro (first 15%: ${introZoneCount}), Body (middle 70%: ${bodyZoneCount}), and Conclusion (last 15%: ${conclusionZoneCount}).`,
  };

  // 3. Logical Chain Check (Transition Phrases)
  const transitionsFound: string[] = [];
  for (const phrase of TRANSITION_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi");
    const matches = content.bodyText.match(regex);
    if (matches) {
      transitionsFound.push(...matches.map((m) => m.toLowerCase()));
    }
  }

  const logicalChain: LogicalChainResult = {
    transitionCount: transitionsFound.length,
    transitionsFound: Array.from(new Set(transitionsFound)),
    summary: `Informational: Detected ${transitionsFound.length} logical transition phrase(s) aiding argument coherence.`,
  };

  return {
    semanticAbstract,
    zoneDistribution,
    logicalChain,
  };
}
