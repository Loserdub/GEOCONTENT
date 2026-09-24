import { fetchAndExtract } from "../lib/fetch";

const TARGET_URLS = [
  "https://trustnodelogic.com",
  "https://en.wikipedia.org/wiki/Search_engine_optimization",
  "https://news.ycombinator.com",
];

async function runVerification() {
  console.log("=================================================");
  console.log("  GEO Content Gap Checker - Milestone 1 Verification");
  console.log("=================================================\n");

  for (const url of TARGET_URLS) {
    console.log(`[TEST] Fetching and extracting: ${url}`);
    const start = Date.now();
    const result = await fetchAndExtract(url, { timeoutMs: 10000 });
    const duration = Date.now() - start;

    console.log(`[STATUS] Success: ${result.success} | HTTP Status: ${result.statusCode || "N/A"} | Duration: ${duration}ms`);

    if (result.success && result.data) {
      const data = result.data;
      console.log(`  - Title: ${data.title || "(None)"}`);
      console.log(`  - Canonical: ${data.canonicalUrl || "(None)"}`);
      console.log(`  - Meta Desc: ${data.metaDescription ? data.metaDescription.slice(0, 80) + "..." : "(None)"}`);
      console.log(`  - Word Count: ${data.wordCount}`);
      console.log(`  - Paragraphs Count: ${data.paragraphs.length}`);
      console.log(`  - Headings (${data.headings.length}):`);
      data.headings.slice(0, 5).forEach((h) => {
        console.log(`      H${h.level}: ${h.text}`);
      });
      if (data.headings.length > 5) {
        console.log(`      ... and ${data.headings.length - 5} more headings`);
      }
      console.log(`  - JSON-LD Blocks: ${data.jsonLd.length}`);
      if (data.jsonLd.length > 0) {
        console.log(`      First Block @type: ${JSON.stringify((data.jsonLd[0] as Record<string, unknown>)["@type"])}`);
      }
      console.log(`  - Outbound Links: ${data.outboundLinks.length}`);
      data.outboundLinks.slice(0, 3).forEach((link) => {
        console.log(`      -> [${link.domain}] ${link.href.slice(0, 60)}`);
      });
      if (data.outboundLinks.length > 3) {
        console.log(`      ... and ${data.outboundLinks.length - 3} more outbound links`);
      }
      console.log(`  - Body Text Preview:\n    "${data.bodyText.slice(0, 180).replace(/\n/g, " ")}..."`);
    } else {
      console.error(`  - Error: ${result.error}`);
    }

    console.log("\n-------------------------------------------------\n");
  }
}

runVerification().catch((err) => {
  console.error("Verification script failed with error:", err);
  process.exit(1);
});
