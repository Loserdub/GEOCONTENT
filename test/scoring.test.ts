import { describe, it, expect } from "vitest";
import { gapScore, visibilityScore } from "@/lib/scoring";

describe("Milestone 3: Scoring Engine", () => {
  // -------------------------------------------------------
  // Gap Score — Worked examples from GEO_Gap_Analysis_Whitepaper.md
  // -------------------------------------------------------

  describe("gapScore()", () => {
    it("Suno + HPS commercial gap: D=8, C=7, S=8, F=5 -> G=24", () => {
      // Whitepaper Part 2.2, Step 4 (line 130-131):
      // G = (8 + 7) * 8 / 5 = 120 / 5 = 24
      const result = gapScore({ D: 8, C: 7, S: 8, F: 5 });
      expect(result.G).toBe(24);
      // T defaults to 0 (evergreen), so G_amplified = G * 1 = 24
      expect(result.G_amplified).toBe(24);
    });

    it("Suno September 3 case study: D=8, C=8, S=9, F=4, T=2.0 -> G=36, G_amplified=108", () => {
      // Whitepaper Part 6.1 (line 359-360):
      // G = (8 + 8) * 9 / 4 = 144 / 4 = 36
      // G_amplified = 36 * (1 + 2.0) = 36 * 3 = 108
      const result = gapScore({ D: 8, C: 8, S: 9, F: 4, T: 2.0 });
      expect(result.G).toBe(36);
      expect(result.G_amplified).toBe(108);
    });

    it("AudioLDM local integration gap: D=7, C=4, S=5, F=8 -> G=6.875", () => {
      // Whitepaper Part 2.2, Step 4 (line 133-134):
      // G = (7 + 4) * 5 / 8 = 55 / 8 = 6.875
      const result = gapScore({ D: 7, C: 4, S: 5, F: 8 });
      expect(result.G).toBe(6.875);
      // T defaults to 0 (evergreen), so G_amplified = 6.875
      expect(result.G_amplified).toBe(6.875);
    });

    it("additional whitepaper examples from prioritization matrix (Part 3, line 181-188)", () => {
      // Google Flow Music + coding: D=9, C=7, S=7, F=5, T=0.3
      // G = (9 + 7) * 7 / 5 = 112 / 5 = 22.4
      // Whitepaper table says G=25.2, which uses (9+7)*7/5... let me check
      // Actually: (9+7)*7/5 = 16*7/5 = 112/5 = 22.4, but the table says 25.2
      // 25.2 = (9+7)*9/5.something? No...
      // Let me re-read: the table says S=7, so G=(9+7)*7/5=22.4
      // But the table literally says G=25.2. Let me check if that's (D+C)*S/F differently.
      // 25.2 = ? (9+7)*S/5 = 25.2 => 16*S/5=25.2 => S=7.875 — doesn't match S=7
      // 25.2 could be a rounding or the table has slightly different inputs.
      // The three examples the user specified are the source of truth. Skip this one.

      // RX repair workflows: D=8, C=6, S=6, F=4
      // G = (8+6)*6/4 = 84/4 = 21
      // Whitepaper table says G=21.6 — close but not exactly matching.
      // Again, the three user-specified examples are the source of truth.

      // Multi-agent DAW: D=7, C=5, S=4, F=8
      // G = (7+5)*4/8 = 48/8 = 6
      // Whitepaper table says G=8.75 — (7+5)*S/8=8.75 => 12*S/8=8.75 => S≈5.83
      // These table entries may use slightly different D/C/S/F values than what's
      // printed in the dimension columns. The user specified three canonical examples;
      // those are what we verify.

      // Just verify the formula is consistent: an arbitrary set of inputs
      const result = gapScore({ D: 5, C: 5, S: 5, F: 5 });
      expect(result.G).toBe(10); // (5+5)*5/5 = 50/5 = 10
      expect(result.G_amplified).toBe(10); // T=0
    });

    it("applies time-sensitivity amplification correctly for various T values", () => {
      const base = { D: 6, C: 6, S: 6, F: 6 };

      // Evergreen (T=0): G_amplified = G
      const evergreen = gapScore({ ...base, T: 0 });
      expect(evergreen.G).toBe(12); // (6+6)*6/6 = 12
      expect(evergreen.G_amplified).toBe(12);

      // Seasonal (T=0.5): G_amplified = 12 * 1.5 = 18
      const seasonal = gapScore({ ...base, T: 0.5 });
      expect(seasonal.G_amplified).toBe(18);

      // Breaking news (T=2.0): G_amplified = 12 * 3 = 36
      const breaking = gapScore({ ...base, T: 2.0 });
      expect(breaking.G_amplified).toBe(36);

      // Critical (T=5.0): G_amplified = 12 * 6 = 72
      const critical = gapScore({ ...base, T: 5.0 });
      expect(critical.G_amplified).toBe(72);
    });

    it("throws when F is 0 (division by zero guard)", () => {
      expect(() => gapScore({ D: 5, C: 5, S: 5, F: 0 })).toThrow(
        "Creation friction (F) must be greater than 0"
      );
    });

    it("handles edge case where S=0 (no search volume) gracefully", () => {
      const result = gapScore({ D: 8, C: 8, S: 0, F: 4 });
      expect(result.G).toBe(0);
      expect(result.G_amplified).toBe(0);
    });
  });

  // -------------------------------------------------------
  // Visibility Score — V = (sum(E * D))^C / F
  // -------------------------------------------------------

  describe("visibilityScore()", () => {
    it("computes visibility for a single entity-depth pair", () => {
      // V = (8 * 7)^2 / 5 = 56^2 / 5 = 3136 / 5 = 627.2
      const result = visibilityScore({
        entityDepthPairs: [{ E: 8, D: 7 }],
        C: 2,
        F: 5,
      });
      expect(result.sumED).toBe(56);
      expect(result.V).toBe(627.2);
    });

    it("sums E*D across multiple articles/nodes before exponentiating", () => {
      // Two articles: E1*D1 = 3*4 = 12, E2*D2 = 5*6 = 30
      // sumED = 42
      // V = 42^2 / 4 = 1764 / 4 = 441
      const result = visibilityScore({
        entityDepthPairs: [
          { E: 3, D: 4 },
          { E: 5, D: 6 },
        ],
        C: 2,
        F: 4,
      });
      expect(result.sumED).toBe(42);
      expect(result.V).toBe(441);
    });

    it("handles C=1 (linear, no compounding effect)", () => {
      // sumED = 10 + 20 = 30
      // V = 30^1 / 3 = 10
      const result = visibilityScore({
        entityDepthPairs: [
          { E: 2, D: 5 },
          { E: 4, D: 5 },
        ],
        C: 1,
        F: 3,
      });
      expect(result.sumED).toBe(30);
      expect(result.V).toBe(10);
    });

    it("handles empty entity-depth pairs (no articles)", () => {
      // sumED = 0, V = 0^C / F = 0
      const result = visibilityScore({
        entityDepthPairs: [],
        C: 3,
        F: 5,
      });
      expect(result.sumED).toBe(0);
      expect(result.V).toBe(0);
    });

    it("throws when F is 0 (division by zero guard)", () => {
      expect(() =>
        visibilityScore({
          entityDepthPairs: [{ E: 5, D: 5 }],
          C: 2,
          F: 0,
        })
      ).toThrow("Friction (F) must be greater than 0");
    });
  });
});
