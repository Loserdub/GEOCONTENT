export interface HeadingItem {
  level: number;
  text: string;
}

export interface OutboundLink {
  href: string;
  text: string;
  domain: string;
}

export interface ExtractedContent {
  url: string;
  canonicalUrl: string | null;
  title: string;
  metaDescription: string | null;
  ogDescription: string | null;
  twitterDescription: string | null;
  headings: HeadingItem[];
  bodyText: string;
  wordCount: number;
  paragraphs: string[];
  jsonLd: Record<string, unknown>[];
  outboundLinks: OutboundLink[];
}

export interface FetchResult {
  success: boolean;
  url: string;
  data?: ExtractedContent;
  error?: string;
  statusCode?: number;
  robotsAllowed?: boolean;
}

export interface FetchOptions {
  timeoutMs?: number;
  userAgent?: string;
  checkRobots?: boolean;
}

// ----------------------------------------------------
// Detector Types (Milestone 2)
// ----------------------------------------------------

export interface CitationFinding {
  type: "high_authority_link" | "in_text_citation" | "academic_source" | "third_party_reference";
  source: string;
  context: string;
}

export interface CitationCheckResult {
  passed: boolean;
  totalOutboundCount: number;
  highAuthorityCount: number;
  thirdPartyCount: number;
  inTextCitationCount: number;
  findings: CitationFinding[];
  summary: string;
}

export interface QuotationFinding {
  quote: string;
  attribution: string;
  context: string;
}

export interface QuotationCheckResult {
  passed: boolean;
  count: number;
  findings: QuotationFinding[];
  summary: string;
}

export interface StatisticFinding {
  value: string;
  category: "percentage" | "metric_quantity" | "ratio" | "dated_point";
  context: string;
}

export interface StatisticsCheckResult {
  passed: boolean;
  count: number;
  findings: StatisticFinding[];
  summary: string;
}

export interface KeywordFrequency {
  term: string;
  count: number;
  densityPercent: number;
}

export interface KeywordStuffingResult {
  passed: boolean; // true = clean/no stuffing, false = stuffed
  isStuffed: boolean;
  thresholdPercent: number;
  flaggedKeywords: KeywordFrequency[];
  topKeywords: KeywordFrequency[];
  summary: string;
}

export interface SchemaItemReport {
  type: string;
  context?: string;
  validJson: boolean;
  hasType: boolean;
  sameAsUrls: string[];
  errors: string[];
}

export interface SchemaValidationResult {
  passed: boolean;
  totalBlocks: number;
  validBlocks: number;
  hasParseErrors: boolean;
  typesFound: string[];
  sameAsUrls: string[];
  reports: SchemaItemReport[];
  errors: string[];
  summary: string;
}

export interface MetaDescriptionCheckResult {
  passed: boolean;
  charCount: number;
  inOptimalRange: boolean; // 120-155 characters
  lengthStatus: "optimal" | "too_short" | "too_long" | "missing";
  isConsistent: boolean;
  metaDesc: string | null;
  ogDesc: string | null;
  twitterDesc: string | null;
  summary: string;
}

export interface SemanticAbstractResult {
  passed: boolean;
  openingWordCount: number;
  detectedTopicOrEntity: string;
  containsEntity: boolean;
  summary: string;
}

export interface ZoneDistributionResult {
  introZoneCount: number; // first 15%
  bodyZoneCount: number; // middle 70%
  conclusionZoneCount: number; // last 15%
  summary: string;
}

export interface LogicalChainResult {
  transitionCount: number;
  transitionsFound: string[];
  summary: string;
}

export interface StructuralCheckResult {
  semanticAbstract: SemanticAbstractResult;
  zoneDistribution: ZoneDistributionResult;
  logicalChain: LogicalChainResult;
}

export interface AnalyzePageOptions {
  customAuthorityDomains?: string[];
}

export interface PageScorecard {
  url: string;
  timestamp: string;
  tactics: {
    citeSources: CitationCheckResult;
    quotations: QuotationCheckResult;
    statistics: StatisticsCheckResult;
    keywordStuffing: KeywordStuffingResult;
    // Fluency / Tone is explicitly deferred
    fluencyAuthoritativeTone?: { status: "deferred"; note: string };
  };
  structural: {
    schemaValidation: SchemaValidationResult;
    metaDescription: MetaDescriptionCheckResult;
    abstractAndFlow: StructuralCheckResult;
  };
}

export interface ScanResultPayload {
  success: boolean;
  url: string;
  statusCode?: number;
  error?: string;
  extracted?: ExtractedContent;
  scorecard?: PageScorecard;
}

// ----------------------------------------------------
// Milestone 4: Multi-page Topic Mapping & Gap Report
// ----------------------------------------------------

export type TopicType = "entity" | "concept" | "technology" | "event";

export interface PageTopic {
  /** Normalized topic or entity name (not a sentence, e.g. "HPS-1.0", "Suno") */
  name: string;
  /** Semantic classification of this topic */
  type: TopicType;
  /** Approximate number of times the topic appears in the body text */
  mentions: number;
}

export interface PageTopicMap {
  url: string;
  title: string;
  topics: PageTopic[];
}

export interface GapCandidate {
  topicA: string;
  topicB: string;
  /** Number of scanned pages topicA appears on */
  pageFreqA: number;
  /** Number of scanned pages topicB appears on */
  pageFreqB: number;
  /** Combined word count of pages where topicA appears */
  wordCountA: number;
  /** Combined word count of pages where topicB appears */
  wordCountB: number;
  /** pageFreqA + pageFreqB — used for pre-ranking before LLM batching */
  combinedFreq: number;
  /** Pages topicA appears on */
  pagesA: string[];
  /** Pages topicB appears on */
  pagesB: string[];
}

export interface NumericGapScore {
  topicA: string;
  topicB: string;
  /** Topical depth 0-10 */
  D: number;
  /** Predicted external connectivity 0-10 */
  C: number;
  /** Search volume proxy 0-10 */
  S: number;
  /** Creation friction 1-10 */
  F: number;
}

export interface GapJustification {
  topicA: string;
  topicB: string;
  D_justification: string;
  C_justification: string;
  S_justification: string;
  F_justification: string;
}

export interface ScoredGap {
  topicA: string;
  topicB: string;
  D: number;
  C: number;
  S: number;
  F: number;
  T: number;
  G: number;
  G_amplified: number;
  rationale?: {
    D: string;
    C: string;
    S: string;
    F: string;
    T?: string;
  };
  pagesA: string[];
  pagesB: string[];
}

export interface TopicMapEntry {
  topic: string;
  type: TopicType;
  pageCount: number;
  pageUrls: string[];
}

export interface GapReport {
  /** All recurring topics (appearing on 2+ pages) */
  recurringTopics: TopicMapEntry[];
  /** Total candidate gap pairs found after pre-filtering */
  totalCandidatesFound: number;
  /** Number of candidates actually sent to the LLM for scoring */
  candidatesSentToLLM: number;
  /** Number of candidates excluded (above the batch cap) — reported explicitly, not dropped silently */
  candidatesExcluded: number;
  /** All scored gaps, sorted by G_amplified descending */
  scoredGaps: ScoredGap[];
  /** Top N gaps by G_amplified for the report (see MAX_REPORT_GAPS) */
  topGaps: ScoredGap[];
}

// ----------------------------------------------------
// Milestone 5+: GEO Agentic IDE Prompt Writer Types
// ----------------------------------------------------

export interface LAAZoneMetrics {
  targetWordCount: number;
  f_E: number;
  introWords: number;
  introEntityMentions: number;
  coreWords: number;
  coreEntityMentions: number;
  outroWords: number;
  outroEntityMentions: number;
}

export interface AgenticPromptOptions {
  /** Target word count for the planned gap-filling piece (default: 1500) */
  wordCount?: number;
  /** Core entity name(s) to anchor (default: "Justin Ray / Trust Node Logic") */
  coreEntity?: string;
  /** Suggested target file path (e.g. "articles/suno-hps-bridge.md") */
  targetFilename?: string;
  /** Additional domain notes or custom instructions for the Agent */
  customNotes?: string;
}

