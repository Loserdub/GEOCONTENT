import React from "react";
import type { ScanResultPayload } from "@/types";
import { ExternalLink } from "lucide-react";
import { PageSelector } from "./PageSelector";
import { TacticSection } from "./TacticSection";
import { StructuralSection } from "./StructuralSection";

export interface ScorecardViewProps {
  results: ScanResultPayload[];
  selectedPageIndex: number;
  onSelectPage: (index: number) => void;
}

export function ScorecardView({
  results,
  selectedPageIndex,
  onSelectPage,
}: ScorecardViewProps) {
  const activeResult = results[selectedPageIndex];

  return (
    <section className="space-y-5 animate-fade-in" aria-labelledby="scorecards-heading">
      <h2 id="scorecards-heading" className="sr-only">Page Scorecards</h2>

      {/* Horizontal Page Selector */}
      <PageSelector
        results={results}
        selectedPageIndex={selectedPageIndex}
        onSelectPage={onSelectPage}
      />

      {/* Active Page Card */}
      {activeResult && (
        <article
          id={`page-tabpanel-${selectedPageIndex}`}
          role="region"
          aria-labelledby={`page-tab-${selectedPageIndex}`}
          className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden shadow-lg focus:outline-none"
        >
          {/* Card Header */}
          <header className="p-5 sm:p-6 border-b border-border-subtle flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-3xl">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    activeResult.success
                      ? "bg-success-muted text-success-text border border-success/30"
                      : "bg-danger-muted text-danger-text border border-danger/30"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeResult.success ? "bg-success" : "bg-danger"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{activeResult.success ? "200 OK" : "FAILED"}</span>
                </span>
                <a
                  href={activeResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base sm:text-lg font-bold text-text-heading hover:text-accent-text transition-colors flex items-center gap-1.5 min-w-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
                >
                  <span className="truncate">
                    {activeResult.extracted?.title || activeResult.url}
                  </span>
                  <ExternalLink className="h-4 w-4 text-text-muted shrink-0" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
              <p className="text-xs text-text-muted font-mono mt-1.5 truncate">
                {activeResult.url}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeResult.extracted && (
                <span className="text-xs px-3 py-1 rounded-lg bg-surface-overlay text-text-muted font-mono border border-border-subtle">
                  {activeResult.extracted.wordCount.toLocaleString()} words
                </span>
              )}
            </div>
          </header>

          {/* Card Body */}
          <div className="p-5 sm:p-6 space-y-8">
            {!activeResult.success && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-xl bg-danger-muted border border-danger/30 p-4 text-danger-text text-xs space-y-1"
              >
                <p className="font-semibold">Unable to analyze this page:</p>
                <p className="text-text-heading">{activeResult.error || "Failed to fetch or extract page content."}</p>
              </div>
            )}

            {activeResult.scorecard && activeResult.extracted && (
              <>
                <TacticSection tactics={activeResult.scorecard.tactics} />
                <StructuralSection
                  structural={activeResult.scorecard.structural}
                  metaDescription={activeResult.extracted.metaDescription}
                />
              </>
            )}
          </div>
        </article>
      )}
    </section>
  );
}
