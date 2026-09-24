import { POST } from "../app/api/scan/route";
import { NextRequest } from "next/server";

const TRUSTNODE_CLUSTER = [
  "https://trustnodelogic.com/what-is-hybrid.html",
  "https://trustnodelogic.com/hybridproductionstandard.html",
  "https://trustnodelogic.com/sunonewtos.html",
  "https://trustnodelogic.com/Suno101.html",
  "https://trustnodelogic.com/c2pa-music-provenance.html",
  "https://trustnodelogic.com/agentichybridproduction.html",
];

async function runSmokeTests() {
  console.log("=================================================");
  console.log("  GEO Content Gap Checker — Final Smoke Tests");
  console.log("=================================================\n");

  let allPassed = true;

  // ----------------------------------------------------
  // Smoke Test 1: TrustNode Cluster Preset (Multi-Page Gap Report)
  // ----------------------------------------------------
  console.log("-------------------------------------------------");
  console.log("  SMOKE TEST 1: TrustNode Cluster Preset (6 URLs)");
  console.log("-------------------------------------------------");
  const start1 = Date.now();
  const req1 = new NextRequest("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: TRUSTNODE_CLUSTER }),
  });

  const res1 = await POST(req1);
  const duration1 = Date.now() - start1;
  const data1 = await res1.json();

  console.log(`HTTP Status: ${res1.status} (elapsed: ${duration1}ms)`);
  console.log(`Total scanned: ${data1.scannedCount}, Successful: ${data1.successfulCount}`);
  console.log(`Gap report generated: ${Boolean(data1.gapReport)}`);

  if (data1.gapReport) {
    console.log(`Recurring topics found: ${data1.gapReport.recurringTopics?.length ?? 0}`);
    console.log(`Top content gaps scored: ${data1.gapReport.topGaps?.length ?? 0}`);
    if (data1.gapReport.topGaps?.length > 0) {
      const topGap = data1.gapReport.topGaps[0];
      console.log(`  Top Gap #1: "${topGap.topicA}" <-> "${topGap.topicB}"`);
      console.log(`  Factors: D=${topGap.D}, C=${topGap.C}, S=${topGap.S}, F=${topGap.F} => G=${topGap.G.toFixed(1)}`);
      if (topGap.rationale) {
        console.log(`  Prose Justification (Pass 2): ${JSON.stringify(topGap.rationale)}`);
      }
    }
  }

  const test1Pass =
    res1.status === 200 &&
    data1.scannedCount === 6 &&
    data1.successfulCount >= 5 &&
    Boolean(data1.gapReport);

  if (test1Pass) {
    console.log(">>> [PASS] Smoke Test 1: Multi-page scan and gap analysis succeeded.\n");
  } else {
    console.error(">>> [FAIL] Smoke Test 1 did not produce expected results.\n");
    allPassed = false;
  }

  // ----------------------------------------------------
  // Smoke Test 2: Single Page Preset (Scorecard Only, No Gap Report)
  // ----------------------------------------------------
  console.log("-------------------------------------------------");
  console.log("  SMOKE TEST 2: Single Page Preset (Scorecard Only)");
  console.log("-------------------------------------------------");
  const start2 = Date.now();
  const req2 = new NextRequest("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://trustnodelogic.com" }),
  });

  const res2 = await POST(req2);
  const duration2 = Date.now() - start2;
  const data2 = await res2.json();

  console.log(`HTTP Status: ${res2.status} (elapsed: ${duration2}ms)`);
  console.log(`Total scanned: ${data2.scannedCount}, Successful: ${data2.successfulCount}`);
  console.log(`Gap report is null: ${data2.gapReport === null}`);

  const singleResult = data2.results?.[0];
  if (singleResult?.scorecard) {
    const sc = singleResult.scorecard;
    console.log(`Page title: "${singleResult.extracted?.title}"`);
    console.log(`Word count: ${singleResult.extracted?.wordCount}`);
    console.log(`Cite sources passed: ${sc.tactics.citeSources.passed}`);
    console.log(`Quotations passed: ${sc.tactics.quotations.passed}`);
    console.log(`Statistics passed: ${sc.tactics.statistics.passed}`);
    console.log(`Keyword stuffing clean: ${sc.tactics.keywordStuffing.passed}`);
    console.log(`Schema.org valid: ${sc.structural.schemaValidation.passed}`);
    console.log(`Meta description: ${sc.structural.metaDescription.lengthStatus} (${sc.structural.metaDescription.charCount} chars)`);
  }

  const test2Pass =
    res2.status === 200 &&
    data2.scannedCount === 1 &&
    data2.successfulCount === 1 &&
    data2.gapReport === null &&
    Boolean(singleResult?.scorecard);

  if (test2Pass) {
    console.log(">>> [PASS] Smoke Test 2: Single page scorecard generated without gap report.\n");
  } else {
    console.error(">>> [FAIL] Smoke Test 2 did not produce expected results.\n");
    allPassed = false;
  }

  // ----------------------------------------------------
  // Smoke Test 3: Deliberately Malformed / Invalid URL Path
  // ----------------------------------------------------
  console.log("-------------------------------------------------");
  console.log("  SMOKE TEST 3: Deliberately Malformed / Unreachable URL");
  console.log("-------------------------------------------------");
  const start3 = Date.now();
  const req3 = new NextRequest("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      urls: [
        "https://this-domain-does-not-exist-at-all-8971239.invalid/bad",
        "not-a-valid-http-protocol://foo/bar",
      ],
    }),
  });

  const res3 = await POST(req3);
  const duration3 = Date.now() - start3;
  const data3 = await res3.json();

  console.log(`HTTP Status: ${res3.status} (elapsed: ${duration3}ms)`);
  console.log(`Total scanned: ${data3.scannedCount}, Successful: ${data3.successfulCount}`);

  for (let i = 0; i < (data3.results?.length ?? 0); i++) {
    const r = data3.results[i];
    console.log(`  [${i}] ${r.url} -> success: ${r.success} | error: "${r.error}"`);
  }

  const test3Pass =
    res3.status === 200 &&
    data3.scannedCount === 2 &&
    data3.successfulCount === 0 &&
    data3.results.every((r: { success: boolean }) => r.success === false);

  if (test3Pass) {
    console.log(">>> [PASS] Smoke Test 3: Malformed/invalid URLs handled gracefully with success:false.\n");
  } else {
    console.error(">>> [FAIL] Smoke Test 3 did not produce expected results.\n");
    allPassed = false;
  }

  // ----------------------------------------------------
  // Final Verification Summary
  // ----------------------------------------------------
  console.log("=================================================");
  if (allPassed) {
    console.log("  ALL 3 SMOKE TESTS PASSED CLEANLY!");
    console.log("=================================================");
  } else {
    console.error("  SOME SMOKE TESTS FAILED!");
    console.log("=================================================");
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error("Smoke test execution error:", err);
  process.exit(1);
});
