import React from "react";
import type { PageScorecard } from "@/types";
import { Code } from "lucide-react";
import { StatusPill } from "../common/StatusPill";

export interface StructuralSectionProps {
  structural: PageScorecard["structural"];
  metaDescription: string | null;
}

export function StructuralSection({
  structural,
  metaDescription,
}: StructuralSectionProps) {
  const { schemaValidation, metaDescription: metaDescResult, abstractAndFlow } = structural;
  const { semanticAbstract, zoneDistribution, logicalChain } = abstractAndFlow;

  return (
    <div className="space-y-4 pt-4 border-t border-border-subtle">
      <div className="flex items-center gap-2">
        <Code className="h-4 w-4 text-secondary-text shrink-0" aria-hidden="true" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          2. Structural & Schema Quality
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schema.org Structured Data */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-heading">Schema.org JSON-LD</span>
            <StatusPill passed={schemaValidation.passed} passLabel="PASS" failLabel="FAIL" />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{schemaValidation.summary}</p>
          {schemaValidation.typesFound.length > 0 && (
            <p className="text-xs text-text-faint font-mono">
              Types: {schemaValidation.typesFound.join(", ")}
            </p>
          )}
        </div>

        {/* Meta Description */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-heading">Meta Description</span>
            <StatusPill
              variant={metaDescResult.passed ? "emerald" : "amber"}
              label={
                metaDescResult.passed
                  ? "OPTIMAL"
                  : metaDescResult.lengthStatus.replace(/_/g, " ").toUpperCase()
              }
            />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{metaDescResult.summary}</p>
          {metaDescription && (
            <blockquote className="text-xs bg-surface-card p-2 rounded border border-border-subtle text-text-faint italic">
              &ldquo;{metaDescription}&rdquo;
            </blockquote>
          )}
        </div>

        {/* Semantic Abstract */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-heading">Semantic Abstract</span>
            <StatusPill
              variant={semanticAbstract.passed ? "emerald" : "amber"}
              label={semanticAbstract.passed ? "PASS" : "CAUTION"}
            />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {semanticAbstract.summary}
          </p>
        </div>

        {/* Attention Zones & Flow */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-heading">Attention Zones & Flow</span>
            <StatusPill variant="slate" label="FYI" />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {zoneDistribution.summary}
          </p>
          <p className="text-xs text-text-faint leading-relaxed">
            {logicalChain.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
