import { fetchAndExtract } from "../lib/fetch";
import { extractPageTopicsAlgorithmic } from "../lib/extractors/topicExtraction";
import { batchGapScoringNumeric } from "../lib/llm/gapScoringNumeric";
import { batchGapJustifications } from "../lib/llm/gapJustification";
import {
  identifyGapCandidates,
  scoreGaps,
  attachJustifications,
  assembleGapReport,
  MIN_PAGE_FREQUENCY,
  MAX_RATIONALE_BATCH_SIZE,
  MAX_REPORT_GAPS,
} from "../lib/gapMapping";

// Verification URLs
// Verification URLs from trustnodelogic.com cluster
const TARGET_URLS = [
  "https://trustnodelogic.com/what-is-hybrid.html",
  "https://trustnodelogic.com/hybridproductionstandard.html",
  "https://trustnodelogic.com/sunonewtos.html",
  "https://trustnodelogic.com/Suno101.html",
  "https://trustnodelogic.com/c2pa-music-provenance.html",
  "https://trustnodelogic.com/agentichybridproduction.html",
];

async function runMilestone4Verification() {
  console.log("=================================================");
  console.log("  GEO Content Gap Checker - Milestone 4 Verification");
  console.log(`  Architecture: Algorithmic Extraction + 2-Pass Gemini Scoring`);
  console.log(`  Constants: MIN_PAGE_FREQUENCY=${MIN_PAGE_FREQUENCY}, MAX_RATIONALE_BATCH_SIZE=${MAX_RATIONALE_BATCH_SIZE}, MAX_REPORT_GAPS=${MAX_REPORT_GAPS}`);
  console.log("=================================================\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
  }

  // ----------------------------------------------------
  // Step 1: Fetch & Extract
  // ----------------------------------------------------
  console.log(`[Step 1] Fetching and extracting ${TARGET_URLS.length} pages...\n`);
  const extractedPages = [];
  const pageWordCounts = new Map<string, number>();

  for (const url of TARGET_URLS) {
    process.stdout.write(`  Fetching ${url}... `);
    const result = await fetchAndExtract(url, { timeoutMs: 10000 });
    if (!result.success || !result.data) {
      console.log(`FAILED: ${result.error}`);
      continue;
    }
    console.log(`OK (${result.data.wordCount} words, ${result.data.outboundLinks.length} outbound links)`);
    extractedPages.push(result.data);
    pageWordCounts.set(url, result.data.wordCount);
  }

  if (extractedPages.length < 2) {
    console.error("\nNeed at least 2 successfully fetched pages for multi-page analysis. Aborting.");
    process.exit(1);
  }

  // ----------------------------------------------------
  // Step 2: Algorithmic Topic Extraction (0 LLM calls)
  // ----------------------------------------------------
  console.log(`\n[Step 2] Extracting topics algorithmically (0 LLM calls)...\n`);
  const pageMaps = [];
  for (const page of extractedPages) {
    const topicMap = extractPageTopicsAlgorithmic(page);
    console.log(`  Page: "${page.title || page.url}" (${topicMap.topics.length} topics)`);
    console.log(`    Topics: ${topicMap.topics.map((t) => `"${t.name}" [${t.type}] (${t.mentions}x)`).join(", ")}`);
    pageMaps.push(topicMap);
  }

  // ----------------------------------------------------
  // Step 3: Co-Occurrence Map & Candidate Identification
  // ----------------------------------------------------
  console.log(`\n[Step 3] Building co-occurrence map and identifying gap candidates...`);
  const {
    candidates,
    recurringTopics,
    totalCandidatesFound,
    candidatesSentToLLM,
    candidatesExcluded,
  } = identifyGapCandidates(pageMaps, pageWordCounts);

  console.log(`  Recurring topics (${MIN_PAGE_FREQUENCY}+ pages): ${recurringTopics.length}`);
  for (const t of recurringTopics) {
    console.log(`    - "${t.topic}" [${t.type}] — found on ${t.pageCount} page(s)`);
  }

  console.log(`\n  Total candidate gap pairs identified: ${totalCandidatesFound}`);
  console.log(`  Candidates sent to Pass 1 for scoring: ${candidatesSentToLLM}`);
  if (candidatesExcluded > 0) {
    console.log(`  ⚠ ${candidatesExcluded} additional candidate pair(s) identified but not scored in this pass (above the ${MAX_RATIONALE_BATCH_SIZE}-pair cap)`);
  }

  if (candidates.length === 0) {
    console.log("\n  No gap candidates found — all recurring topic pairs co-occur on at least one shared page, or no topics appear on 2+ pages.");
    console.log("  (Tip: When pages cover entirely different subject domains, cross-page topic overlap may be low; testing with multiple related pages on a single domain produces more recurring topics.)");
    process.exit(0);
  }

  // ----------------------------------------------------
  // Step 4: Pass 1 — Batched Numeric Scoring (1 LLM call)
  // ----------------------------------------------------
  console.log(`\n[Step 4] Pass 1: Batched numeric scoring via Gemini (1 LLM call for ${candidatesSentToLLM} pairs)...`);

  const contextSummary = pageMaps
    .map((p) => `- ${p.url}: "${p.title}" (${p.topics.map((t) => t.name).join(", ")})`)
    .join("\n");

  const numericScores = await batchGapScoringNumeric(candidates, contextSummary);
  console.log(`  Numeric scores returned for ${numericScores.length}/${candidatesSentToLLM} candidate pairs`);

  // Score using pure gapScore() from scoring.ts
  const scoredGaps = scoreGaps(candidates, numericScores);

  // ----------------------------------------------------
  // Step 5: Pass 2 — Prose Justifications for Top N (1 LLM call)
  // ----------------------------------------------------
  const topGapsSlice = scoredGaps.slice(0, MAX_REPORT_GAPS);
  console.log(`\n[Step 5] Pass 2: Drafting prose justifications for top ${topGapsSlice.length} gaps via Gemini (1 LLM call)...`);

  const justifications = await batchGapJustifications(topGapsSlice, contextSummary);
  console.log(`  Justifications returned for ${justifications.length}/${topGapsSlice.length} top gaps`);

  const topGapsWithJustifications = attachJustifications(topGapsSlice, justifications);

  // ----------------------------------------------------
  // Step 6: Assemble & Print Report
  // ----------------------------------------------------
  const report = assembleGapReport(
    scoredGaps,
    topGapsWithJustifications,
    totalCandidatesFound,
    candidatesSentToLLM,
    candidatesExcluded,
    recurringTopics
  );

  console.log("\n=================================================");
  console.log("  TOPICAL GAP REPORT");
  console.log("=================================================");
  console.log(`  Scanned pages: ${extractedPages.length}`);
  console.log(`  Recurring topics identified: ${report.recurringTopics.length}`);
  console.log(`  Total gap pairs identified: ${report.totalCandidatesFound}`);
  console.log(`  Candidates scored in Pass 1: ${report.scoredGaps.length}`);
  if (report.candidatesExcluded > 0) {
    console.log(`  ⚠ ${report.candidatesExcluded} additional candidate pair(s) identified but not scored in this pass`);
  }
  console.log(`\n  Top ${Math.min(MAX_REPORT_GAPS, report.topGaps.length)} content gaps ranked by G priority:\n`);

  for (let i = 0; i < report.topGaps.length; i++) {
    const gap = report.topGaps[i];
    console.log(`  ${i + 1}. "${gap.topicA.toUpperCase()}" <──> "${gap.topicB.toUpperCase()}"`);
    console.log(`     G Priority Score: ${gap.G.toFixed(2)} (G_amplified: ${gap.G_amplified.toFixed(2)})`);
    console.log(`     Factors: Depth(D)=${gap.D} | Connectivity(C)=${gap.C} | Search(S)=${gap.S} | Friction(F)=${gap.F} | Time(T)=${gap.T}`);
    if (gap.rationale) {
      console.log(`     - D Rationale: ${gap.rationale.D}`);
      console.log(`     - C Rationale: ${gap.rationale.C}`);
      console.log(`     - S Rationale: ${gap.rationale.S}`);
      console.log(`     - F Rationale: ${gap.rationale.F}`);
    }
    console.log(`     - Topic A Pages (${gap.topicA}): ${gap.pagesA.join(", ")}`);
    console.log(`     - Topic B Pages (${gap.topicB}): ${gap.pagesB.join(", ")}`);
    console.log();
  }
}

runMilestone4Verification().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
