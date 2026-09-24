import type { ScoredGap, AgenticPromptOptions, LAAZoneMetrics } from "@/types";

/**
 * Calculates mathematical word count distributions and entity frequencies
 * based on the LAA-v2 (Latent Anchor Algorithm v2) specification.
 *
 * What it DOES:
 * - Computes total entity mentions: f_E = ceil(word_count / 500) + 1.
 * - Computes 15% intro, 70% technical core, and 15% outro target word counts.
 * - Allocates f_E across zones: 50% intro (rounded up), 0% core (strictly), 50% outro (rounded down).
 * - Pure arithmetic calculation with 0 external dependencies.
 *
 * What it DOES NOT DO:
 * - Does not validate grammar or count words in external drafts.
 */
export function calculateLAAZoneMetrics(wordCount: number = 1500): LAAZoneMetrics {
  const safeCount = Math.max(300, Math.round(wordCount));
  const f_E = Math.ceil(safeCount / 500) + 1;
  const introWords = Math.round(safeCount * 0.15);
  const outroWords = Math.round(safeCount * 0.15);
  const coreWords = safeCount - introWords - outroWords; // exact remaining 70%

  const introEntityMentions = Math.ceil(f_E / 2);
  const outroEntityMentions = Math.floor(f_E / 2);

  return {
    targetWordCount: safeCount,
    f_E,
    introWords,
    introEntityMentions,
    coreWords,
    coreEntityMentions: 0,
    outroWords,
    outroEntityMentions,
  };
}

/**
 * Generates a clean URL slug from two gap topics.
 *
 * What it DOES:
 * - Normalizes topic names into a filesystem/URL-friendly slug (e.g. "suno-hps-1-0-bridge").
 *
 * What it DOES NOT DO:
 * - Does not check if the file already exists on disk.
 */
export function generateSuggestedSlug(topicA: string, topicB: string): string {
  const cleanA = topicA.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cleanB = topicB.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${cleanA}-${cleanB}-bridge`;
}

/**
 * Formats a list of candidate Schema.org DefinedTerms based on the topic pair.
 *
 * What it DOES:
 * - Formats 2-4 candidate DefinedTerms with sensible Wikipedia and Wikidata links.
 *
 * What it DOES NOT DO:
 * - Does not execute live SPARQL or Wikidata API lookups.
 */
export function getCandidateDefinedTerms(
  topicA: string,
  topicB: string
): Array<{ name: string; url: string; sameAs?: string }> {
  const formatName = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const encodeTopic = (str: string) =>
    encodeURIComponent(str.replace(/\s+/g, "_"));

  return [
    {
      name: formatName(topicA),
      url: `https://en.wikipedia.org/wiki/${encodeTopic(topicA)}`,
    },
    {
      name: formatName(topicB),
      url: `https://en.wikipedia.org/wiki/${encodeTopic(topicB)}`,
    },
    {
      name: "Generative Engine Optimization",
      url: "https://en.wikipedia.org/wiki/Search_engine_optimization",
      sameAs: "https://www.wikidata.org/wiki/Q180711",
    },
    {
      name: "Content Provenance & Authenticity",
      url: "https://en.wikipedia.org/wiki/Content_authenticity",
      sameAs: "https://www.wikidata.org/wiki/Q3273849",
    },
  ];
}

/**
 * Generates a complete, ready-to-run Agentic IDE Prompt for writing an article
 * that bridges a specific topical gap zone using the LAA-v2 framework.
 *
 * What it DOES:
 * - Formats the exact LAA-v2 instructions from .agents/LAA-v2_Article_Writing_Instructions.md.
 * - Injects concrete scanned gap context (Topic A pages, Topic B pages, D/C/S/F/G metrics, factor rationales).
 * - Injects exact mathematical allocations (Word count, f_E, 15/70/15 zone word counts).
 * - Injects custom Schema.org JSON-LD capstone skeleton with suggested DefinedTerms.
 * - Enforces zero em dashes and practitioner voice.
 * - Injects a strict agent verification checklist to guarantee output correctness.
 * - Pure formatting function with 0 network calls.
 *
 * What it DOES NOT DO:
 * - Does not call LLMs or generate the article text itself.
 */
export function generateAgenticGapPrompt(
  gap: ScoredGap,
  options?: AgenticPromptOptions
): string {
  const wordCount = options?.wordCount ?? 1500;
  const coreEntity = options?.coreEntity?.trim() || "Justin Ray / Trust Node Logic";
  const slug = options?.targetFilename?.trim() || `articles/${generateSuggestedSlug(gap.topicA, gap.topicB)}.md`;
  const metrics = calculateLAAZoneMetrics(wordCount);
  const terms = getCandidateDefinedTerms(gap.topicA, gap.topicB);

  const lines: string[] = [];

  // Directive Header for the Agentic IDE
  lines.push(`# Agentic IDE Task: Write LAA-v2 Gap-Filling Article`);
  lines.push(`**Target Output File:** \`${slug}\``);
  lines.push(`**Framework:** Latent Anchor Algorithm v2 (LAA-v2)`);
  lines.push(`**Target Concept Bridge:** ${gap.topicA.toUpperCase()} ↔ ${gap.topicB.toUpperCase()}`);
  lines.push(`**Target Word Count:** ${metrics.targetWordCount} words`);
  lines.push(`**Core Entity to Anchor:** ${coreEntity}`);
  lines.push(`**Total Entity Frequency ($f_E$):** ${metrics.f_E} mentions`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 1: Detected Gap Intelligence
  lines.push("## 1. Scanned GEO Gap Context & Intelligence");
  lines.push("");
  lines.push(`An automated GEO scan detected a high-priority content gap between **${gap.topicA}** and **${gap.topicB}** on the site.`);
  lines.push(`- **Topic A ("${gap.topicA}")** appears on: ${gap.pagesA.join(", ")}`);
  lines.push(`- **Topic B ("${gap.topicB}")** appears on: ${gap.pagesB.join(", ")}`);
  lines.push(`- **Co-occurrence:** 0 pages. These two core topics exist on separate pages across the site but are NEVER bridged together on any single page.`);
  lines.push("");
  lines.push("### Mathematical Gap Priority Score");
  lines.push(`- **Formula:** \`G = (D + C) * S / F\``);
  lines.push(`- **G Priority Score:** **${gap.G.toFixed(2)}** (G_amplified: **${gap.G_amplified.toFixed(2)}** with T=${gap.T})`);
  lines.push(`- **Topical Depth (D):** ${gap.D}/10 ${gap.rationale?.D ? `— *${gap.rationale.D}*` : ""}`);
  lines.push(`- **External Connectivity (C):** ${gap.C}/10 ${gap.rationale?.C ? `— *${gap.rationale.C}*` : ""}`);
  lines.push(`- **Search Demand Proxy (S):** ${gap.S}/10 ${gap.rationale?.S ? `— *${gap.rationale.S}*` : ""}`);
  lines.push(`- **Creation Friction (F):** ${gap.F}/10 ${gap.rationale?.F ? `— *${gap.rationale.F}*` : ""}`);
  if (options?.customNotes) {
    lines.push(`- **Custom Notes / Directives:** ${options.customNotes}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 2: Instructions to the AI Agent
  lines.push("## 2. Instructions to the AI Agent");
  lines.push("");
  lines.push("You are an expert technical author operating under the strict structural rules of the LAA-v2 framework. Author the complete, publication-ready article and save it directly to the target file.");
  lines.push("");
  lines.push("### Rule 1: The 15/70/15 Attention Zone Scaffold");
  lines.push(`Split the article into three distinct zones by word count for an exact target of ~${metrics.targetWordCount} words:`);
  lines.push("");
  lines.push(`1. **Intro Zone (~${metrics.introWords} words, exactly 15% of total):**`);
  lines.push(`   - Must contain byline plus core entity name: "${coreEntity}".`);
  lines.push(`   - Opening hook explaining why bridging ${gap.topicA} and ${gap.topicB} matters right now.`);
  lines.push(`   - A clear, one-sentence thesis stating what this article proves or teaches.`);
  lines.push(`   - **Entity Allocation:** Exactly **${metrics.introEntityMentions}** entity mention${metrics.introEntityMentions !== 1 ? "s" : ""}.`);
  lines.push("");
  lines.push(`2. **Technical Core Zone (~${metrics.coreWords} words, exactly 70% of total):**`);
  lines.push(`   - Completely neutral, peer-grade technical content explaining the bridge.`);
  lines.push(`   - **STRICT RULE:** Exactly **0 mentions** of "${coreEntity}" or brand names anywhere in this zone.`);
  lines.push(`   - Maximum information density: architecture diagrams, code/syntax examples, comparison tables, step-by-step technical workflows.`);
  lines.push(`   - Must read as if a peer engineer with zero prior knowledge of the author would find it immediately authoritative on its own merits.`);
  lines.push("");
  lines.push(`3. **Outro Zone (~${metrics.outroWords} words, exactly 15% of total):**`);
  lines.push(`   - Synthesize how the technical core connects back to ${coreEntity}'s broader body of work.`);
  lines.push(`   - Close with author attribution.`);
  lines.push(`   - Conclude with a clear call to action (consulting, standard reference, or tool).`);
  lines.push(`   - **Entity Allocation:** Exactly **${metrics.outroEntityMentions}** entity mention${metrics.outroEntityMentions !== 1 ? "s" : ""}.`);
  lines.push("");

  lines.push("### Rule 2: Token Proximity Enforcement");
  lines.push(`Every single mention of "${coreEntity}" (total of ${metrics.f_E} across the entire piece) MUST sit within **12 tokens** of the target concept (${gap.topicA} or ${gap.topicB}), connected by a strong predicate (an active verb linking entity and concept).`);
  lines.push("");
  lines.push("> **Valid Example (tightly bound):**");
  lines.push(`> "Developed by Justin Ray, the ${gap.topicA} framework integrates directly with ${gap.topicB} systems to resolve..."`);
  lines.push("");

  lines.push("### Rule 3: Voice and Tone (Practitioner, not SEO-Speak)");
  lines.push("Write like someone who actually built the system, explaining it to a peer. Do not use generic marketing language, buzzwords, or filler. Every sentence in the technical core must contain concrete, specific details.");
  lines.push("");

  lines.push("### Rule 4: Global Non-Negotiable Constraints");
  lines.push("- **No Em Dashes:** Do NOT use the em dash character (`—` or `&mdash;`) anywhere in the piece. Replace any em dashes with periods, commas, or parentheses.");
  lines.push("- **Meta Description:** Provide a meta description of **exactly 120-155 characters**, and repeat this identical string for `<meta name=\"description\">`, Open Graph, and Twitter metadata.");
  lines.push("- **Heading Hierarchy:** Use a single `# H1` title, `## H2` for the major zones/sections, and `### H3` for technical subsections.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 3: Schema.org JSON-LD Capstone
  lines.push("## 3. Schema.org JSON-LD Capstone Scaffold");
  lines.push("Include the following validated JSON-LD block at the conclusion of the article / frontmatter:");
  lines.push("");
  lines.push("```json");
  const schemaObj = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: `${gap.topicA.toUpperCase()} and ${gap.topicB.toUpperCase()}: The Definitive Technical Integration Guide`,
        description: "[INSERT_EXACT_120_155_CHAR_META_DESCRIPTION_HERE]",
        author: {
          "@type": "Person",
          name: coreEntity.split("/")[0].trim(),
          knowsAbout: terms.map((t) => ({
            "@type": "DefinedTerm",
            name: t.name,
            url: t.url,
            ...(t.sameAs ? { sameAs: t.sameAs } : {}),
          })),
        },
      },
    ],
  };
  lines.push(JSON.stringify(schemaObj, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Section 4: Agent Verification Checklist
  lines.push("## 4. Agent Self-Verification Checklist");
  lines.push("Before marking the task complete, verify every single item below:");
  lines.push("");
  lines.push(`- [ ] Total word count is within ±5% of ${metrics.targetWordCount} words.`);
  lines.push(`- [ ] Intro zone is ~${metrics.introWords} words (15%) with exactly ${metrics.introEntityMentions} mention(s) of "${coreEntity}".`);
  lines.push(`- [ ] Technical core zone is ~${metrics.coreWords} words (70%) with EXACTLY 0 mentions of "${coreEntity}" or brand names.`);
  lines.push(`- [ ] Outro zone is ~${metrics.outroWords} words (15%) with exactly ${metrics.outroEntityMentions} mention(s) of "${coreEntity}".`);
  lines.push(`- [ ] Total entity mentions equal exactly ${metrics.f_E}.`);
  lines.push("- [ ] Every entity mention is within 12 tokens of a target concept with an active verb predicate.");
  lines.push("- [ ] Zero em dashes (`—`) exist anywhere in the draft.");
  lines.push("- [ ] Meta description is strictly 120-155 characters.");
  lines.push("- [ ] Schema.org JSON-LD capstone is present, valid JSON, with relevant DefinedTerms.");
  lines.push("");

  return lines.join("\n");
}

/**
 * Generates a consolidated Markdown bundle containing Agentic IDE Prompts
 * for all top identified content gaps in the scan report.
 *
 * What it DOES:
 * - Formats multiple gap prompts into a single structured master document.
 * - Pure formatting function with 0 external dependencies.
 *
 * What it DOES NOT DO:
 * - Does not filter or alter input gap records.
 */
export function generateBatchAgenticPrompts(
  gaps: ScoredGap[],
  options?: AgenticPromptOptions
): string {
  if (!gaps || gaps.length === 0) {
    return "# GEO Agentic IDE Prompts\n\nNo topical gap pairs found to generate prompts for.";
  }

  const lines: string[] = [];
  lines.push("# GEO Agentic IDE Prompts: Master Gap-Filling Roadmap");
  lines.push(`**Generated:** ${new Date().toUTCString()}`);
  lines.push(`**Total Gap-Filling Prompts:** ${gaps.length}`);
  lines.push("");
  lines.push("This document contains ready-to-run prompts for an AI Agent / IDE to author articles bridging all detected content gap zones on the site.");
  lines.push("");
  lines.push("---");
  lines.push("");

  gaps.forEach((gap, idx) => {
    lines.push(`## Gap ${idx + 1}: ${gap.topicA.toUpperCase()} ↔ ${gap.topicB.toUpperCase()} (G Score: ${gap.G.toFixed(1)})`);
    lines.push("");
    lines.push(generateAgenticGapPrompt(gap, {
      ...options,
      targetFilename: `articles/${generateSuggestedSlug(gap.topicA, gap.topicB)}.md`,
    }));
    lines.push("");
    lines.push("================================================================================");
    lines.push("");
  });

  return lines.join("\n");
}
