import type { ExtractedContent, SchemaValidationResult, SchemaItemReport } from "@/types";

/**
 * Validates JSON-LD schema blocks, checking syntax, @type definitions, and sameAs links.
 *
 * What it DOES:
 * - Flags unparseable JSON-LD blocks (_parseError from extraction) as schema syntax failures.
 * - Inspects each valid schema block for required @context and @type properties.
 * - Extracts sameAs entity links and validates their URL syntax.
 * - Summarizes detected Schema.org entity types and returns pass/fail status with itemized errors.
 *
 * What it DOES NOT DO:
 * - Does not perform deep schema inheritance type checking across the entire Schema.org taxonomy.
 * - Does not make external network HEAD requests to verify if sameAs third-party endpoints are live.
 */
export function validateSchema(content: ExtractedContent): SchemaValidationResult {
  const reports: SchemaItemReport[] = [];
  const errors: string[] = [];
  const typesFound: string[] = [];
  const sameAsUrls: string[] = [];
  let validBlocks = 0;
  let hasParseErrors = false;

  for (let i = 0; i < content.jsonLd.length; i++) {
    const block = content.jsonLd[i];

    // Check for M1 extraction parse errors
    if (block._parseError) {
      hasParseErrors = true;
      const snippet = block.rawContent ? ` (${String(block.rawContent).slice(0, 60)}...)` : "";
      const errorMsg = `Block #${i + 1}: Malformed JSON syntax in script tag${snippet}.`;
      errors.push(errorMsg);
      reports.push({
        type: "MalformedJSON",
        validJson: false,
        hasType: false,
        sameAsUrls: [],
        errors: [errorMsg],
      });
      continue;
    }

    const blockErrors: string[] = [];
    validBlocks++;

    // Validate @type
    const rawType = block["@type"];
    let typeName = "";
    if (typeof rawType === "string") {
      typeName = rawType;
      typesFound.push(rawType);
    } else if (Array.isArray(rawType)) {
      typeName = rawType.join(", ");
      typesFound.push(...rawType.map(String));
    } else {
      blockErrors.push(`Block #${i + 1}: Missing or invalid @type definition.`);
    }

    // Validate @context
    const context = typeof block["@context"] === "string" ? block["@context"] : undefined;
    if (!context) {
      blockErrors.push(`Block #${i + 1}: Missing @context definition (expected "https://schema.org").`);
    }

    // Validate sameAs URLs if present
    const blockSameAs: string[] = [];
    const rawSameAs = block.sameAs;
    if (typeof rawSameAs === "string") {
      blockSameAs.push(rawSameAs);
    } else if (Array.isArray(rawSameAs)) {
      for (const s of rawSameAs) {
        if (typeof s === "string") blockSameAs.push(s);
      }
    }

    for (const urlStr of blockSameAs) {
      try {
        new URL(urlStr);
        sameAsUrls.push(urlStr);
      } catch {
        blockErrors.push(`Block #${i + 1}: Invalid sameAs URL format: "${urlStr}".`);
      }
    }

    if (blockErrors.length > 0) {
      errors.push(...blockErrors);
    }

    reports.push({
      type: typeName || "UnknownType",
      context,
      validJson: true,
      hasType: Boolean(typeName),
      sameAsUrls: blockSameAs,
      errors: blockErrors,
    });
  }

  const passed = content.jsonLd.length > 0 && !hasParseErrors && errors.length === 0;

  let summary = "";
  if (content.jsonLd.length === 0) {
    summary = "Failed. No JSON-LD structured data blocks found on page.";
  } else if (hasParseErrors) {
    summary = `Failed. Found ${content.jsonLd.length} schema block(s), but one or more contain malformed JSON syntax.`;
  } else if (errors.length > 0) {
    summary = `Caution. Found ${validBlocks} schema block(s) with ${errors.length} validation issue(s): ${errors[0]}`;
  } else {
    const typesStr = typesFound.slice(0, 4).join(", ");
    summary = `Passed. Valid JSON-LD structured data detected (${validBlocks} block(s), types: ${typesStr || "Custom"}).`;
  }

  return {
    passed,
    totalBlocks: content.jsonLd.length,
    validBlocks,
    hasParseErrors,
    typesFound,
    sameAsUrls,
    reports,
    errors,
    summary,
  };
}
