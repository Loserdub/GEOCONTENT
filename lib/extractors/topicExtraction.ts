import type { ExtractedContent, PageTopic, PageTopicMap, TopicType } from "@/types";

/**
 * Standard list of English stopwords to filter out of n-gram extraction.
 */
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
  "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
  "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
  "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
  "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
  "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
  "some", "such", "than", "that", "that's", "the", "their", "theirs", "them",
  "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
  "they're", "they've", "this", "those", "through", "to", "too", "under",
  "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're",
  "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
  "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
  "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
  "your", "yours", "yourself", "yourselves", "also", "many", "use", "using",
  "used", "page", "site", "web", "one", "two", "new", "first", "article",
  "content", "information", "help", "need", "like", "well", "see", "get",
  "read", "looking", "ahead", "going", "forward", "actually", "means", "revealed",
  "plainly", "entries", "archive", "hub", "overview", "section", "part", "chapter",
  "built", "alike", "across", "within", "without", "guide", "notes", "field", "notes"
]);

/**
 * Classifies a topic into entity, technology, concept, or event based on lexical patterns.
 */
function classifyTopic(name: string): TopicType {
  const lower = name.toLowerCase();

  // Technology patterns: acronyms, tools, protocols, standards
  if (
    /\b(api|dsp|mcp|osc|daw|sdk|vst|vst3|json-ld|c2pa|ai|llm|tfidf|seo|acrcloud|ddex|ern)\b/i.test(name) ||
    /hps-1\.0/i.test(name) ||
    /^(suno|audioldm|musicgen|stable audio|flow music|python|javascript|react|next\.js)/i.test(name)
  ) {
    return "technology";
  }

  // Entity patterns: proper nouns, brand names, person names
  if (
    /^(justin ray|trust node logic|loserdub|jray|bmg|google|anthropic|openai|wikipedia|reddit|soundcloud|musicbrainz)/i.test(name)
  ) {
    return "entity";
  }

  // Event patterns
  if (
    /\b(september|august|october|november|december|update|release|deadline|launch|202\d)\b/i.test(lower)
  ) {
    return "event";
  }

  // Default: concept
  return "concept";
}

/**
 * Canonicalizes topic strings to maximize cross-page semantic overlap.
 */
function canonicalizeTopicName(raw: string): string {
  const cleaned = raw
    .replace(/^[\/\#\d\.\)\-\:\s]+/, "") // remove leading symbols/numbering
    .replace(/[()[\]{}"'`“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = cleaned.toLowerCase();
  if (lower === "hps" || lower === "hps 1.0" || lower === "hps-1.0" || lower === "the hps" || lower === "hybrid production standard hps" || lower === "hybrid production standard") return "HPS-1.0";
  if (lower === "c2pa" || lower === "c2pa metadata" || lower === "c2pa provenance" || lower === "c2pa music provenance") return "C2PA Provenance";
  if (lower === "suno" || lower === "suno ai" || lower === "suno 101" || lower === "suno generation") return "Suno";
  if (lower === "hybrid production" || lower === "hybrid music production") return "Hybrid Production";
  if (lower === "music provenance" || lower === "provenance") return "Content Provenance";
  if (lower === "dsp" || lower === "audio dsp" || lower === "web audio dsp" || lower === "spectral splitting") return "DSP & Spectral Splitting";
  if (lower === "audio engineering" || lower === "studio engineering") return "Audio Engineering";
  if (lower === "metadata" || lower === "cryptographic metadata") return "Cryptographic Metadata";
  if (lower === "justin ray" || lower === "jray") return "Justin Ray";
  if (lower === "trust node logic") return "Trust Node Logic";
  if (lower === "mixr studio" || lower === "mixr") return "MIXR Studio";
  if (lower === "licensing" || lower === "music licensing" || lower === "bmg" || lower === "terms of service") return "Music Licensing & Terms";
  if (lower === "agent" || lower === "agents" || lower === "multi agent" || lower === "virtual studio" || lower === "autonomous virtual studio") return "Autonomous Agent Architecture";
  if (lower === "latent" || lower === "latent space" || lower === "slerp") return "Latent Space Audio";

  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Algorithmic topic extraction using TF-IDF / RAKE style phrase and keyword ranking.
 *
 * What it DOES:
 * - Extracts 5-10 core topics/entities from extracted page content purely algorithmically.
 * - Prioritizes key entities, technologies, headings, and high-frequency terms.
 * - Canonicalizes key entities to enable accurate cross-page co-occurrence matching.
 * - Requires 0 LLM calls and 0 network requests.
 *
 * What it DOES NOT DO:
 * - Does not make external network requests or LLM calls.
 */
export function extractPageTopicsAlgorithmic(content: ExtractedContent): PageTopicMap {
  const text = content.bodyText;
  const candidateScores = new Map<string, { name: string; score: number; count: number }>();

  function addCandidate(rawName: string, weightBoost: number) {
    if (!rawName) return;
    const canonical = canonicalizeTopicName(rawName);
    if (canonical.length < 3 || canonical.length > 35) return;

    const lower = canonical.toLowerCase();
    const words = lower.split(/\s+/);
    if (words.some((w) => STOPWORDS.has(w) && words.length === 1)) return;
    if (words.every((w) => STOPWORDS.has(w))) return;

    // Count mentions in body text
    const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = text.match(regex);
    const count = matches ? matches.length : 1;

    // Calculate score
    const lengthMultiplier = words.length > 1 ? 1.3 : 1.0;
    const score = (count * 2 + weightBoost) * lengthMultiplier;

    if (!candidateScores.has(lower) || candidateScores.get(lower)!.score < score) {
      candidateScores.set(lower, { name: canonical, score, count });
    }
  }

  // 1. Check title parts
  if (content.title) {
    const titleParts = content.title.split(/[-–—|:·]+/);
    for (const part of titleParts) {
      addCandidate(part.trim(), 12.0);
    }
  }

  // 2. Check headings
  for (const h of content.headings) {
    const boost = h.level === 1 ? 8.0 : h.level === 2 ? 5.0 : 3.0;
    const parts = h.text.split(/[-–—|:·&]+/);
    for (const part of parts) {
      addCandidate(part.trim(), boost);
    }
  }

  // 3. Known domain entities / technology scan across body text
  const DOMAIN_KEYWORDS = [
    "Suno", "HPS-1.0", "C2PA", "C2PA Provenance", "Hybrid Production",
    "Content Provenance", "Audio Engineering", "DSP & Spectral Splitting",
    "Cryptographic Metadata", "Justin Ray", "Trust Node Logic",
    "Music Licensing & Terms", "Autonomous Agent Architecture", "Latent Space Audio"
  ];

  for (const kw of DOMAIN_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      addCandidate(kw, matches.length * 3.0);
    }
  }

  // 4. Extract high-frequency n-grams from body text
  const cleanTokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  // Bigrams
  for (let i = 0; i < cleanTokens.length - 1; i++) {
    const t1 = cleanTokens[i];
    const t2 = cleanTokens[i + 1];
    if (!STOPWORDS.has(t1) && !STOPWORDS.has(t2)) {
      addCandidate(`${t1} ${t2}`, 2.0);
    }
  }

  // Sort candidates by score descending
  const sorted = Array.from(candidateScores.values())
    .sort((a, b) => b.score - a.score);

  // Deduplicate
  const selected: PageTopic[] = [];
  const selectedKeys = new Set<string>();

  for (const item of sorted) {
    const key = item.name.toLowerCase();
    if (selectedKeys.has(key)) continue;

    selected.push({
      name: item.name,
      type: classifyTopic(item.name),
      mentions: Math.max(1, item.count),
    });
    selectedKeys.add(key);

    if (selected.length >= 10) break;
  }

  return {
    url: content.url,
    title: content.title,
    topics: selected,
  };
}
