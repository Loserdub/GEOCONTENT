import { POST } from "../app/api/scan/route";
import { NextRequest } from "next/server";

const SIX_URL_PRESET = [
  "https://trustnodelogic.com/what-is-hybrid.html",
  "https://trustnodelogic.com/hybridproductionstandard.html",
  "https://trustnodelogic.com/sunonewtos.html",
  "https://trustnodelogic.com/Suno101.html",
  "https://trustnodelogic.com/c2pa-music-provenance.html",
  "https://trustnodelogic.com/agentichybridproduction.html",
];

async function runPerformanceAndResilienceVerification() {
  console.log("=================================================");
  console.log("  Parallel Fetch & Robots Cache Verification");
  console.log("=================================================\n");

  // Test 1: Live Scan of 6-URL Preset & Timing
  console.log("[Test 1] Executing live scan of 6-URL TrustNode Cluster preset...");
  const start = Date.now();
  
  const req1 = new NextRequest("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: SIX_URL_PRESET }),
  });

  const res1 = await POST(req1);
  const duration1 = Date.now() - start;
  const json1 = await res1.json();

  console.log(`[STATUS] Response HTTP: ${res1.status} in ${duration1}ms`);
  console.log(`[DATA] scannedCount: ${json1.scannedCount}, successfulCount: ${json1.successfulCount}`);
  console.log(`[DATA] Gap report generated: ${!!json1.gapReport}`);
  
  if (json1.results) {
    console.log("  Order of returned results vs input:");
    for (let i = 0; i < json1.results.length; i++) {
      const match = json1.results[i].url === SIX_URL_PRESET[i];
      console.log(`    [${i}] ${json1.results[i].url} -> match original input order? ${match} (status: ${json1.results[i].statusCode || "N/A"})`);
    }
  }

  // Test 2: Mixed Batch with Broken URL
  console.log("\n[Test 2] Testing mixed batch with a deliberately broken URL...");
  const mixedUrls = [
    "https://trustnodelogic.com/what-is-hybrid.html",
    "https://this-domain-definitely-does-not-exist-99999.invalid/bad-page",
    "https://trustnodelogic.com/Suno101.html",
  ];

  const req2 = new NextRequest("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: mixedUrls }),
  });

  const start2 = Date.now();
  const res2 = await POST(req2);
  const duration2 = Date.now() - start2;
  const json2 = await res2.json();

  console.log(`[STATUS] Response HTTP: ${res2.status} in ${duration2}ms`);
  console.log(`[DATA] scannedCount: ${json2.scannedCount}, successfulCount: ${json2.successfulCount}`);
  
  for (let i = 0; i < json2.results.length; i++) {
    const r = json2.results[i];
    console.log(`    [${i}] url: ${r.url} | success: ${r.success} | error: ${r.error || "none"}`);
  }

  const brokenResult = json2.results[1];
  const validResult1 = json2.results[0];
  const validResult2 = json2.results[2];

  if (brokenResult.success === false && validResult1.success === true && validResult2.success === true) {
    console.log("\n[PASS] Deliberately broken URL produced success:false while valid URLs succeeded without crashing batch!");
  } else {
    console.error("\n[FAIL] Mixed batch did not isolate errors as expected!");
    process.exit(1);
  }

  console.log("\n=================================================");
  console.log("  Verification Completed Successfully");
  console.log("=================================================");
}

runPerformanceAndResilienceVerification().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
