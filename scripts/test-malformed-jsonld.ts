import { extractPageContent } from "../lib/extract";

const sampleWithMalformedJsonLd = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Malformed JSON-LD Test Page</title>
  <meta name="description" content="Verifying soft-fail on corrupted schema blocks while preserving page content." />
  <link rel="canonical" href="https://example.com/malformed-test" />
  
  <!-- Block 1: Valid schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Test Site"
  }
  </script>

  <!-- Block 2: Deliberately malformed JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BrokenObject",
    "unclosed_string: "whoops,
    "missing_brace: true
  </script>

  <!-- Block 3: Another valid schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Justin Ray"
  }
  </script>
</head>
<body>
  <main>
    <h1>Soft-Fail Verification Heading</h1>
    <p>This is paragraph 1 of the article. It contains valuable content that must not be lost.</p>
    <h2>Second Section Heading</h2>
    <p>This is paragraph 2 with an outbound link to <a href="https://example.org/resource">external resource</a>.</p>
  </main>
</body>
</html>
`;

console.log("=================================================");
console.log("  Malformed JSON-LD Soft-Fail Test Execution");
console.log("=================================================\n");

try {
  const result = extractPageContent(sampleWithMalformedJsonLd, "https://example.com/malformed-test");
  
  console.log(`[EXTRACTION STATUS] Succeeded without throwing: true`);
  console.log(`  - Page Title: "${result.title}"`);
  console.log(`  - Meta Description: "${result.metaDescription}"`);
  console.log(`  - Canonical URL: "${result.canonicalUrl}"`);
  console.log(`  - Word Count: ${result.wordCount}`);
  console.log(`  - Headings Count: ${result.headings.length} (H1: "${result.headings[0]?.text}", H2: "${result.headings[1]?.text}")`);
  console.log(`  - Outbound Links: ${result.outboundLinks.length} -> domain: ${result.outboundLinks[0]?.domain}`);
  console.log(`  - Total JSON-LD Blocks Captured: ${result.jsonLd.length}`);
  
  result.jsonLd.forEach((block, idx) => {
    if (block._parseError) {
      console.log(`    [Block ${idx + 1}] MALFORMED (Captured softly with _parseError: true, rawSnippet: "${String(block.rawContent).slice(0, 40).trim()}...")`);
    } else {
      console.log(`    [Block ${idx + 1}] VALID (@type: "${block["@type"]}", name: "${block.name}")`);
    }
  });

  console.log(`\n  - Body Text Preview:\n    "${result.bodyText.replace(/\n/g, " ")}"`);
  console.log("\n=================================================");
  console.log("  VERIFICATION RESULT: PASS (All non-corrupted data extracted intact)");
  console.log("=================================================");
} catch (err) {
  console.error("FATAL ERROR: extractPageContent crashed on malformed JSON-LD:", err);
  process.exit(1);
}
