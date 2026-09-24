import React, { useRef } from "react";
import type { ScanResultPayload } from "@/types";

export interface PageSelectorProps {
  results: ScanResultPayload[];
  selectedPageIndex: number;
  onSelectPage: (index: number) => void;
}

export function PageSelector({
  results,
  selectedPageIndex,
  onSelectPage,
}: PageSelectorProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % results.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + results.length) % results.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = results.length - 1;
    } else {
      return;
    }

    onSelectPage(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Page scorecards"
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin"
    >
      {results.map((r, idx) => {
        const isActive = selectedPageIndex === idx;
        const pageTitle = r.extracted?.title || r.url.replace(/^https?:\/\//, "");

        return (
          <button
            key={idx}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            id={`page-tab-${idx}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`page-tabpanel-${idx}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelectPage(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            aria-label={`Scorecard ${idx + 1} of ${results.length}: ${pageTitle}, ${
              r.success ? "status passed" : "status failed"
            }`}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              isActive
                ? "bg-surface-card text-text-heading border border-accent/60 shadow-sm"
                : "bg-surface-raised text-text-muted hover:bg-surface-card hover:text-text-heading border border-border-subtle"
            }`}
          >
            {/* Visible Status Badge with text + dot */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                r.success
                  ? "bg-success-muted text-success-text border border-success/30"
                  : "bg-danger-muted text-danger-text border border-danger/30"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  r.success ? "bg-success" : "bg-danger"
                }`}
                aria-hidden="true"
              />
              <span>{r.success ? "PASS" : "FAIL"}</span>
            </span>

            {/* Page Title */}
            <span className="max-w-[150px] sm:max-w-[200px] truncate font-mono">
              {pageTitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
