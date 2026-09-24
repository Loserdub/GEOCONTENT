import React from "react";
import type { ScoredGap } from "@/types";
import { ChevronDown, ChevronUp, ExternalLink, Bot } from "lucide-react";

export interface GapCardProps {
  gap: ScoredGap;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  totalScannedPages: number;
  onOpenPromptModal?: (gap: ScoredGap) => void;
}

const PRIORITY_STYLES = {
  high:     { bg: "bg-accent-muted text-accent-text border border-accent/30",     label: "HIGH PRIORITY" },
  moderate: { bg: "bg-surface-card text-text-muted border border-border-subtle",  label: "MODERATE" },
  niche:    { bg: "bg-surface-card text-text-faint border border-border-subtle",   label: "NICHE OPPORTUNITY" },
};

const FACTOR_COLUMNS = [
  { key: "D" as const, label: "Topical Depth",   valueClass: "text-accent-text",     defaultNote: "Ecosystem breadth and substantive material depth." },
  { key: "C" as const, label: "Connectivity",     valueClass: "text-secondary-text",  defaultNote: "Citation and external backlink acquisition potential." },
  { key: "S" as const, label: "Search Demand",    valueClass: "text-success-text",    defaultNote: "Searcher intent and industry query volume." },
  { key: "F" as const, label: "Friction",         valueClass: "text-warning-text",    defaultNote: "Authoring and research difficulty required to bridge." },
];

export function GapCard({
  gap,
  index,
  isExpanded,
  onToggleExpand,
  totalScannedPages,
  onOpenPromptModal,
}: GapCardProps) {
  const priority =
    gap.G >= 20 ? "high" : gap.G >= 12 ? "moderate" : "niche";
  const { bg: priorityBg, label: priorityLabel } = PRIORITY_STYLES[priority];
  const cardId = `gap-card-${index}`;
  const bodyId = `gap-card-body-${index}`;

  return (
    <article
      className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden shadow-md transition hover:border-border-strong"
      aria-labelledby={cardId}
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-border-subtle flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-surface-overlay text-text-muted font-mono text-xs font-bold shrink-0"
              aria-label={`Rank ${index + 1}`}
            >
              {index + 1}
            </span>
            <h3
              id={cardId}
              className="text-base sm:text-lg font-bold text-text-heading flex items-center gap-2 min-w-0"
            >
              <span className="text-accent-text font-mono uppercase truncate max-w-[140px] sm:max-w-none">
                {gap.topicA}
              </span>
              <span className="text-text-muted font-normal text-sm shrink-0" aria-hidden="true">↔</span>
              <span className="text-secondary-text font-mono uppercase truncate max-w-[140px] sm:max-w-none">
                {gap.topicB}
              </span>
            </h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${priorityBg}`}>
              {priorityLabel}
            </span>
          </div>

          <p className="text-xs text-text-muted">
            Never co-occurs on any single page across {totalScannedPages} scanned pages.
          </p>
        </div>

        {/* Score + Action + Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenPromptModal && (
            <button
              type="button"
              onClick={() => onOpenPromptModal(gap)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-overlay hover:bg-accent-muted border border-border-subtle hover:border-accent/40 text-xs font-medium text-text-muted hover:text-accent-text transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label={`Generate Agentic IDE Prompt for ${gap.topicA} and ${gap.topicB}`}
            >
              <Bot className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
              <span className="hidden sm:inline">Agent Prompt</span>
            </button>
          )}

          <div className="text-right pl-1">
            <div className="text-[11px] text-text-muted font-medium">Gap Score (G)</div>
            <div
              className="text-xl sm:text-2xl font-black text-accent-text font-mono leading-none mt-0.5"
              aria-label={`Score: ${gap.G.toFixed(1)} points`}
            >
              {gap.G.toFixed(1)}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-controls={bodyId}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} details for ${gap.topicA} and ${gap.topicB} content gap`}
            className="p-2 rounded-lg bg-surface-overlay hover:bg-border-subtle text-text-muted hover:text-text-heading focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div id={bodyId} className="p-5 sm:p-6 space-y-5 animate-fade-in">
          {/* Factor pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FACTOR_COLUMNS.map(({ key, label, valueClass, defaultNote }) => (
              <div key={key} className="bg-surface-overlay p-3.5 rounded-xl border border-border-subtle">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                  <span className="font-semibold text-text-heading">{label}</span>
                  <span className={`font-mono font-bold ${valueClass}`}>{gap[key]}/10</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {gap.rationale?.[key] ?? defaultNote}
                </p>
              </div>
            ))}
          </div>

          {/* Pages where each topic appears */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { topic: gap.topicA, pages: gap.pagesA, color: "text-accent-text" },
                { topic: gap.topicB, pages: gap.pagesB, color: "text-secondary-text" },
              ] as const
            ).map(({ topic, pages, color }) => (
              <div key={topic} className="bg-surface-overlay p-3 rounded-lg border border-border-subtle">
                <p className="text-xs mb-1.5">
                  <span className={`font-semibold font-mono uppercase ${color}`}>{topic}</span>
                  <span className="text-text-muted ml-1.5">on {pages.length} page{pages.length !== 1 ? "s" : ""}:</span>
                </p>
                <ul className="space-y-1">
                  {pages.map((url, pIdx) => (
                    <li key={pIdx} className="truncate">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-muted hover:text-text-heading font-mono text-xs inline-flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
