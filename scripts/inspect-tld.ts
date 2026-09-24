import { fetchAndExtract } from "../lib/fetch";

async function inspectTrustNodeLogic() {
  const result = await fetchAndExtract("https://trustnodelogic.com");
  if (!result.success || !result.data) {
    console.error("Failed:", result.error);
    return;
  }

  console.log("=== FULL EXTRACTED BODY TEXT FOR TRUSTNODELOGIC.COM ===");
  console.log(result.data.bodyText);
  console.log("\n=== PARAGRAPHS (" + result.data.paragraphs.length + ") ===");
  result.data.paragraphs.forEach((p, i) => {
    console.log(`[P${i + 1}] ${p}`);
  });
}

inspectTrustNodeLogic();
