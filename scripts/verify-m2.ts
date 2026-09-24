import { fetchAndExtract } from "../lib/fetch";
import { analyzePage } from "../lib/detectors";

const TARGET_URLS = [
  "https://trustnodelogic.com",
  "https://en.wikipedia.org/wiki/Search_engine_optimization",
  "https://news.ycombinator.com",
];

async function runMilestone2Verification() {
  console.log("=================================================");
  console.log("  GEO Content Gap Checker - Milestone 2 Scorecard Verification");
  console.log("=================================================\n");

  for (const url of TARGET_URLS) {
    console.log(`[SCANNING] ${url}`);
    const fetchRes = await fetchAndExtract(url, { timeoutMs: 10000 });

    if (!fetchRes.success || !fetchRes.data) {
      console.error(`  Fetch Failed: ${fetchRes.error}\n`);
      continue;
    }

    const sc = analyzePage(fetchRes.data);

    console.log(`\n=== SCORECARD REPORT: ${fetchRes.data.title || url} ===`);
    console.log(`URL: ${url} | Words: ${fetchRes.data.wordCount}`);

    console.log("\n1. VALIDATED GEO TACTICS:");
    console.log(`  - Cite Sources: [${sc.tactics.citeSources.passed ? "PASS" : "FAIL"}] (Auth: ${sc.tactics.citeSources.highAuthorityCount}, 3rd-Party: ${sc.tactics.citeSources.thirdPartyCount}, In-Text: ${sc.tactics.citeSources.inTextCitationCount}) -> ${sc.tactics.citeSources.summary}`);
    console.log(`  - Quotations:   [${sc.tactics.quotations.passed ? "PASS" : "FAIL"}] (Count: ${sc.tactics.quotations.count}) -> ${sc.tactics.quotations.summary}`);
    console.log(`  - Statistics:   [${sc.tactics.statistics.passed ? "PASS" : "FAIL"}] (Count: ${sc.tactics.statistics.count}) -> ${sc.tactics.statistics.summary}`);
    console.log(`  - KW Stuffing:  [${sc.tactics.keywordStuffing.passed ? "CLEAN" : "FLAGGED"}] -> ${sc.tactics.keywordStuffing.summary}`);
    console.log(`  - Tone Scoring: [DEFERRED] -> ${sc.tactics.fluencyAuthoritativeTone?.note}`);

    console.log("\n2. STRUCTURAL & SCHEMA QUALITY:");
    console.log(`  - Schema.org:   [${sc.structural.schemaValidation.passed ? "PASS" : "FAIL"}] (Valid: ${sc.structural.schemaValidation.validBlocks}/${sc.structural.schemaValidation.totalBlocks}, ParseErrors: ${sc.structural.schemaValidation.hasParseErrors}) -> ${sc.structural.schemaValidation.summary}`);
    if (sc.structural.schemaValidation.errors.length > 0) {
      sc.structural.schemaValidation.errors.forEach((e) => console.log(`      Error: ${e}`));
    }
    console.log(`  - Meta Desc:    [${sc.structural.metaDescription.passed ? "PASS" : "CAUTION"}] (Length: ${sc.structural.metaDescription.charCount} chars, Status: ${sc.structural.metaDescription.lengthStatus}) -> ${sc.structural.metaDescription.summary}`);
    console.log(`  - Abstract:     [${sc.structural.abstractAndFlow.semanticAbstract.passed ? "PASS" : "CAUTION"}] -> ${sc.structural.abstractAndFlow.semanticAbstract.summary}`);
    console.log(`  - Zone Dist:    ${sc.structural.abstractAndFlow.zoneDistribution.summary}`);
    console.log(`  - Logical Flow: ${sc.structural.abstractAndFlow.logicalChain.summary}`);

    console.log("\n-------------------------------------------------\n");
  }
}

runMilestone2Verification().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
