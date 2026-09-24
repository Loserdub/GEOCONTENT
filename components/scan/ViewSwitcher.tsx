import React, { useRef } from "react";
import { TrendingUp, FileCheck2, Copy, Check, Download, Bot } from "lucide-react";

export interface ViewSwitcherProps {
  activeView: "gaps" | "scorecards";
  setActiveView: (view: "gaps" | "scorecards") => void;
  hasGaps: boolean;
  gapCount: number;
  resultCount: number;
  copiedMd: boolean;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  copiedPrompts?: boolean;
  onCopyAllPrompts?: () => void;
  onDownloadAllPrompts?: () => void;
}

export function ViewSwitcher({
  activeView,
  setActiveView,
  hasGaps,
  gapCount,
  resultCount,
  copiedMd,
  onCopyMarkdown,
  onDownloadMarkdown,
  copiedPrompts,
  onCopyAllPrompts,
  onDownloadAllPrompts,
}: ViewSwitcherProps) {
  const gapsTabRef = useRef<HTMLButtonElement>(null);
  const scorecardsTabRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: "gaps" | "scorecards") => {
    if (!hasGaps) return;

    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextView = current === "gaps" ? "scorecards" : "gaps";
      setActiveView(nextView);
      if (nextView === "gaps") {
        gapsTabRef.current?.focus();
      } else {
        scorecardsTabRef.current?.focus();
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveView("gaps");
      gapsTabRef.current?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveView("scorecards");
      scorecardsTabRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
      {/* WAI-ARIA Tablist */}
      <div
        className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-border-subtle"
        role="tablist"
        aria-label="Result views"
      >
        {hasGaps && (
          <button
            ref={gapsTabRef}
            id="tab-gaps"
            role="tab"
            aria-selected={activeView === "gaps"}
            aria-controls="tabpanel-gaps"
            tabIndex={activeView === "gaps" ? 0 : -1}
            onClick={() => setActiveView("gaps")}
            onKeyDown={(e) => handleKeyDown(e, "gaps")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              activeView === "gaps"
                ? "bg-accent text-white shadow-sm"
                : "text-text-muted hover:text-text-heading"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Gap Report</span>
            <span
              className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                activeView === "gaps"
                  ? "bg-white/20 text-white"
                  : "bg-surface-raised text-text-muted"
              }`}
            >
              {gapCount}
            </span>
          </button>
        )}

        <button
          ref={scorecardsTabRef}
          id="tab-scorecards"
          role="tab"
          aria-selected={activeView === "scorecards"}
          aria-controls="tabpanel-scorecards"
          tabIndex={activeView === "scorecards" ? 0 : -1}
          onClick={() => setActiveView("scorecards")}
          onKeyDown={(e) => handleKeyDown(e, "scorecards")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            activeView === "scorecards"
              ? "bg-accent text-white shadow-sm"
              : "text-text-muted hover:text-text-heading"
          }`}
        >
          <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Scorecards</span>
          <span
            className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
              activeView === "scorecards"
                ? "bg-white/20 text-white"
                : "bg-surface-raised text-text-muted"
            }`}
          >
            {resultCount}
          </span>
        </button>
      </div>

      {/* Export action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {hasGaps && onCopyAllPrompts && (
          <button
            type="button"
            onClick={onCopyAllPrompts}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-card border border-border-subtle hover:bg-accent-muted hover:border-accent/40 px-3.5 py-2 text-xs font-medium text-text-muted hover:text-accent-text focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-all"
            aria-label="Copy all Agentic IDE prompts for content gaps"
          >
            {copiedPrompts ? (
              <Check className="h-3.5 w-3.5 text-success-text" aria-hidden="true" />
            ) : (
              <Bot className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
            )}
            <span>{copiedPrompts ? "Prompts Copied!" : "Copy Agent Prompts"}</span>
          </button>
        )}

        {hasGaps && onDownloadAllPrompts && (
          <button
            type="button"
            onClick={onDownloadAllPrompts}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-overlay hover:border-border-strong px-3.5 py-2 text-xs font-medium text-text-muted hover:text-text-heading focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-all"
            aria-label="Download all Agentic IDE prompts"
          >
            <Download className="h-3.5 w-3.5 text-secondary-text" aria-hidden="true" />
            <span>Download Prompts</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCopyMarkdown}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-overlay hover:border-border-strong px-3.5 py-2 text-xs font-medium text-text-muted hover:text-text-heading focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-all"
          aria-label="Copy full Markdown report to clipboard"
        >
          {copiedMd ? (
            <Check className="h-3.5 w-3.5 text-success-text" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{copiedMd ? "Copied!" : "Copy Markdown"}</span>
        </button>

        <button
          type="button"
          onClick={onDownloadMarkdown}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-overlay hover:border-border-strong px-3.5 py-2 text-xs font-medium text-text-muted hover:text-text-heading focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-all"
          aria-label="Download Markdown report file"
        >
          <Download className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
          <span>Download .md</span>
        </button>
      </div>
    </div>
  );
}
