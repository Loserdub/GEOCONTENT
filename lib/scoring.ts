/**
 * Pure scoring functions for gap analysis and visibility estimation.
 *
 * What it DOES:
 * - Computes the Gap Score (G) from plain numeric inputs using the formula:
 *   G = (D + C) * S / F
 * - Computes the time-amplified Gap Score (G_amplified) using:
 *   G_amplified = G * (1 + T)
 * - Computes the Visibility Score (V) from entity-depth pairs using:
 *   V = (sum(E_i * D_i))^C / F
 *
 * What it DOES NOT DO:
 * - Does not fetch URLs, parse HTML, or make LLM calls.
 * - Does not estimate D, C, S, F, or T values from content -- those are
 *   supplied externally (either manually or by upstream analysis modules).
 * - Does not fabricate backlink counts, search volume, or any data that
 *   requires a paid third-party API.
 */

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface GapScoreInputs {
  /** Topical depth (0-10): how much substantive material exists in the broader ecosystem */
  D: number;
  /** Predicted external connectivity (0-10): how many other sites/sources will likely link */
  C: number;
  /** Search volume proxy (0-10): inferred searcher intent and market size */
  S: number;
  /** Creation friction (1-10): estimated effort to research and write authoritatively */
  F: number;
  /** Time urgency multiplier (default 0 for evergreen). 0.5 = seasonal, 2.0 = breaking news, 5.0+ = critical */
  T?: number;
}

export interface GapScoreResult {
  /** Base gap score: G = (D + C) * S / F */
  G: number;
  /** Time-amplified gap score: G_amplified = G * (1 + T) */
  G_amplified: number;
}

export interface EntityDepthPair {
  /** Entity density score for this node/article */
  E: number;
  /** Topical depth score for this node/article */
  D: number;
}

export interface VisibilityScoreInputs {
  /** Array of entity-density * topical-depth pairs across articles/nodes */
  entityDepthPairs: EntityDepthPair[];
  /** Connectivity exponent (0-10): amplifies the compounding effect of linked coverage */
  C: number;
  /** Friction denominator (1-10): reduces visibility proportional to creation/maintenance difficulty */
  F: number;
}

export interface VisibilityScoreResult {
  /** Visibility score: V = (sum(E_i * D_i))^C / F */
  V: number;
  /** The intermediate sum of E*D products before exponentiation */
  sumED: number;
}

// -------------------------------------------------------
// Gap Score
// -------------------------------------------------------

/**
 * Computes the gap priority score for a candidate content gap.
 *
 * Formula: G = (D + C) * S / F
 *          G_amplified = G * (1 + T)
 *
 * All inputs are plain numbers on a 0-10 scale (F must be >= 1 to avoid
 * division by zero). T defaults to 0 (evergreen) if not provided.
 *
 * Worked examples from GEO_Gap_Analysis_Whitepaper.md:
 *   Suno + HPS commercial:  D=8, C=7, S=8, F=5        -> G=24,    G_amp=24   (T=0)
 *   Suno September 3:       D=8, C=8, S=9, F=4, T=2.0 -> G=36,    G_amp=108
 *   AudioLDM local:         D=7, C=4, S=5, F=8         -> G=6.875, G_amp=6.875
 */
export function gapScore(inputs: GapScoreInputs): GapScoreResult {
  const { D, C, S, F, T = 0 } = inputs;

  if (F <= 0) {
    throw new Error("Creation friction (F) must be greater than 0 to avoid division by zero.");
  }

  const G = ((D + C) * S) / F;
  const G_amplified = G * (1 + T);

  return { G, G_amplified };
}

// -------------------------------------------------------
// Visibility Score
// -------------------------------------------------------

/**
 * Computes the visibility score for an entity's topical cluster.
 *
 * Formula: V = (sum(E_i * D_i))^C / F
 *
 * Where E_i and D_i are the entity density and topical depth for each
 * article/node in the cluster. C is the connectivity exponent that
 * amplifies the compounding effect of linked, deep coverage. F is the
 * friction denominator.
 *
 * This is a cluster-level metric, not a per-gap metric. It estimates
 * the overall authority signal strength of your published body of work
 * in a given topic area.
 */
export function visibilityScore(inputs: VisibilityScoreInputs): VisibilityScoreResult {
  const { entityDepthPairs, C, F } = inputs;

  if (F <= 0) {
    throw new Error("Friction (F) must be greater than 0 to avoid division by zero.");
  }

  const sumED = entityDepthPairs.reduce((acc, pair) => acc + pair.E * pair.D, 0);
  const V = Math.pow(sumED, C) / F;

  return { V, sumED };
}
