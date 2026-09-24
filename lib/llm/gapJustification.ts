import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ScoredGap, GapJustification } from "@/types";

const MODEL = "gemini-3.6-flash";

/**
 * Pass 2: Generates concise prose justifications for the top N scored gaps via a single LLM call.
 *
 * What it DOES:
 * - Accepts up to MAX_REPORT_GAPS (20) scored gaps.
 * - Makes exactly ONE Gemini API call to draft one-line justifications for D, C, S, F.
 * - Implements retry logic on transient failures and gracefully falls back to empty array on fatal error/malformed JSON.
 *
 * What it DOES NOT DO:
 * - Does not re-score or calculate numbers (numbers were established in Pass 1 & scoring.ts).
 * - Does not invent fake citation counts or search volume statistics.
 */
export async function batchGapJustifications(
  topGaps: ScoredGap[],
  contextSummary: string,
  customApiKey?: string
): Promise<GapJustification[]> {
  if (topGaps.length === 0) return [];

  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[gapJustification] No Gemini API key provided (neither via request nor GEMINI_API_KEY env). Returning empty justifications.");
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const gapsText = topGaps
    .map(
      (g, i) =>
        `${i + 1}. "${g.topicA}" <-> "${g.topicB}" (Score: G=${g.G.toFixed(1)} | D=${g.D}, C=${g.C}, S=${g.S}, F=${g.F})`
    )
    .join("\n");

  const prompt = `You are a GEO content strategy analyst. Provide concise one-line justifications for the D, C, S, F scores assigned to the following top content gaps.

Context about the scanned website:
${contextSummary}

Scored gaps to justify:
${gapsText}

Return a JSON array of objects in the EXACT SAME ORDER:
[
  {
    "topicA": "string",
    "topicB": "string",
    "D_justification": "One concise sentence explaining topical depth potential (max 90 chars)",
    "C_justification": "One concise sentence explaining external link/citation potential (max 90 chars)",
    "S_justification": "One concise sentence explaining search/audience intent (max 90 chars)",
    "F_justification": "One concise sentence explaining creation friction and research effort (max 90 chars)"
  }
]

Style Rules:
- Return ONLY valid JSON (a plain array, no markdown code fences)
- Keep each justification concise, professional, and clear`;

  let rawText = "";
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const result = await model.generateContent(prompt);
      rawText = result.response.text().trim();
      break;
    } catch (err: unknown) {
      if (attempts >= maxAttempts) {
        console.warn(`[gapJustification] All ${maxAttempts} attempts failed: ${(err as Error).message}. Returning empty justifications.`);
        return [];
      }
      const delayMs = attempts * 500;
      console.warn(`[gapJustification] Attempt ${attempts} failed (${(err as Error).message}). Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let justifications: GapJustification[] = [];
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      justifications = parsed.filter(
        (j) =>
          typeof j.topicA === "string" &&
          typeof j.topicB === "string" &&
          typeof j.D_justification === "string" &&
          typeof j.C_justification === "string" &&
          typeof j.S_justification === "string" &&
          typeof j.F_justification === "string"
      ) as GapJustification[];
    }
  } catch {
    console.warn(
      "[gapJustification] Failed to parse prose justifications response. Raw:",
      rawText.slice(0, 300)
    );
  }

  return justifications;
}
