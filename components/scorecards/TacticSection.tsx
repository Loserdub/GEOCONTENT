import React from "react";
import type { PageScorecard } from "@/types";
import { ShieldCheck, Link2, Quote, BarChart3, Search } from "lucide-react";
import { StatusPill } from "../common/StatusPill";

export interface TacticSectionProps {
  tactics: PageScorecard["tactics"];
}

export function TacticSection({ tactics }: TacticSectionProps) {
  const { citeSources, quotations, statistics, keywordStuffing } = tactics;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-accent-text shrink-0" aria-hidden="true" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          1. Research-Validated GEO Tactics
          <span className="ml-1.5 text-text-faint font-normal normal-case tracking-normal">
            (Aggarwal et al. 2024)
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cite Sources */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-accent-text shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-text-heading">Cite Sources</span>
            </div>
            <StatusPill passed={citeSources.passed} passLabel="PASS" failLabel="FAIL" />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{citeSources.summary}</p>
          {citeSources.findings.length > 0 && (
            <div className="mt-1 space-y-1 bg-surface-card p-2.5 rounded-lg border border-border-subtle max-h-36 overflow-y-auto scrollbar-thin">
              {citeSources.findings.map((f, fIdx) => (
                <p key={fIdx} className="text-xs text-text-muted font-mono truncate">
                  <span className="text-accent-text">[{f.type}]</span> {f.source}: {f.context}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Quotation Addition */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-secondary-text shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-text-heading">Quotation Addition</span>
            </div>
            <StatusPill passed={quotations.passed} passLabel="PASS" failLabel="FAIL" />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{quotations.summary}</p>
          {quotations.findings.length > 0 && (
            <div className="mt-1 space-y-1.5 bg-surface-card p-2.5 rounded-lg border border-border-subtle">
              {quotations.findings.map((q, qIdx) => (
                <p key={qIdx} className="text-xs text-text-muted italic">
                  &ldquo;{q.quote}&rdquo;{" "}
                  <span className="text-text-faint not-italic">— {q.attribution}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Statistics Addition */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-success-text shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-text-heading">Statistics & Benchmarks</span>
            </div>
            <StatusPill passed={statistics.passed} passLabel="PASS" failLabel="FAIL" />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{statistics.summary}</p>
          {statistics.findings.length > 0 && (
            <div className="mt-1 space-y-1 bg-surface-card p-2.5 rounded-lg border border-border-subtle max-h-36 overflow-y-auto scrollbar-thin">
              {statistics.findings.map((s, sIdx) => (
                <p key={sIdx} className="text-xs text-text-muted font-mono truncate">
                  <span className="text-success-text font-bold">{s.value}</span>{" "}
                  ({s.category}): {s.context}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Keyword Stuffing */}
        <div className="bg-surface-overlay p-4 rounded-xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-warning-text shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-text-heading">Keyword Stuffing Audit</span>
            </div>
            <StatusPill passed={keywordStuffing.passed} passLabel="CLEAN" failLabel="FLAGGED" />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{keywordStuffing.summary}</p>
          {keywordStuffing.topKeywords.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {keywordStuffing.topKeywords.slice(0, 6).map((k, kIdx) => (
                <span
                  key={kIdx}
                  className="px-2 py-0.5 rounded-md bg-surface-card border border-border-subtle text-text-muted font-mono text-xs"
                >
                  {k.term}: {k.densityPercent}% ({k.count}×)
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
