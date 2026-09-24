import type { ExtractedContent, KeywordStuffingResult, KeywordFrequency } from "@/types";

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "could", "did", "do", "does", "doing",
  "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
  "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
  "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
  "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same",
  "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
  "them", "themselves", "then", "there", "these", "they", "this", "those", "through",
  "to", "too", "under", "until", "up", "very", "was", "we", "were", "what",
  "when", "where", "which", "while", "who", "whom", "why", "with", "would", "you",
  "your", "yours", "yourself", "yourselves"
]);

const DEFAULT_THRESHOLD_PERCENT = 2.5;

/**
 * Detects unnatural term frequency or keyword stuffing in body copy.
 *
 * What it DOES:
 * - Tokenizes body text into unigrams and bigrams while excluding stop words.
 * - Computes percentage density for all candidate keywords relative to total words.
 * - Flags terms exceeding the density threshold (default 2.5%).
 * - Returns pass/fail (passed = clean/no stuffing), flagged items, and top term frequencies.
 *
 * What it DOES NOT DO:
 * - Does not penalize natural brand or navigational terms when total word count is very low (<100 words).
 * - Does not estimate search engine ranking penalties.
 */
export function checkKeywordStuffing(
  content: ExtractedContent,
  thresholdPercent: number = DEFAULT_THRESHOLD_PERCENT
): KeywordStuffingResult {
  const words = content.bodyText
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const totalWords = content.wordCount || words.length || 1;

  // Word frequency map
  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  // Also evaluate bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    counts.set(bigram, (counts.get(bigram) || 0) + 1);
  }

  // Extract primary subject terms from title and H1 to exclude from spam flagging
  const primarySubjectTerms = new Set<string>();
  const rawTitle = content.title ? content.title.split(/[|·\-—:]/)[0].trim() : "";
  const rawH1 = content.headings.find((h) => h.level === 1)?.text || "";

  const subjectTokens = `${rawTitle} ${rawH1}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  for (const t of subjectTokens) {
    primarySubjectTerms.add(t);
  }
  for (let i = 0; i < subjectTokens.length - 1; i++) {
    primarySubjectTerms.add(`${subjectTokens[i]} ${subjectTokens[i + 1]}`);
  }

  const allFrequencies: KeywordFrequency[] = [];
  const flaggedKeywords: KeywordFrequency[] = [];

  for (const [term, count] of counts.entries()) {
    // Only evaluate terms that appear at least 3 times
    if (count >= 3) {
      const densityPercent = Number(((count / totalWords) * 100).toFixed(2));
      const item: KeywordFrequency = { term, count, densityPercent };
      allFrequencies.push(item);

      // Flag if density exceeds threshold, word count is sufficient, and term is not the primary topic subject
      const isPrimaryTopic = primarySubjectTerms.has(term);
      if (totalWords >= 150 && densityPercent > thresholdPercent && !isPrimaryTopic) {
        flaggedKeywords.push(item);
      }
    }
  }

  // Sort descending by count / density
  allFrequencies.sort((a, b) => b.count - a.count);
  flaggedKeywords.sort((a, b) => b.densityPercent - a.densityPercent);

  const topKeywords = allFrequencies.slice(0, 10);
  const isStuffed = flaggedKeywords.length > 0;
  const passed = !isStuffed;

  let summary = "";
  if (isStuffed) {
    const listStr = flaggedKeywords.map((k) => `"${k.term}" (${k.densityPercent}%)`).join(", ");
    summary = `Warning. Potential keyword stuffing detected. Term(s) exceeding ${thresholdPercent}% density: ${listStr}.`;
  } else if (totalWords < 150) {
    summary = `Passed. Body text is relatively short (${totalWords} words); no stuffing anomalies detected.`;
  } else {
    summary = `Passed. Natural term distribution across ${totalWords} words (highest keyword density: ${topKeywords[0]?.densityPercent || 0}%).`;
  }

  return {
    passed,
    isStuffed,
    thresholdPercent,
    flaggedKeywords,
    topKeywords,
    summary,
  };
}
