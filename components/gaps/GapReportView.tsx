"use client";

import React, { useState } from "react";
import type { GapReport, ScoredGap } from "@/types";
import { GapCard } from "./GapCard";
import { AgenticPromptModal } from "./AgenticPromptModal";
import { generateBatchAgenticPrompts } from "@/lib/gapPromptWriter";
import { Bot, Check } from "lucide-react";

export interface GapReportViewProps {
  gapReport: GapReport;
  expandedCards: Record<string, boolean>;
  onToggleExpand: (key: string) => void;
  totalScannedPages: number;
}

export function GapReportView({
  gapReport,
  expandedCards,
  onToggleExpand,
  totalScannedPages,
}: GapReportViewProps) {
  const [selectedPromptGap, setSelectedPromptGap] = useState<ScoredGap | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [downloadedBatch, setDownloadedBatch] = useState<boolean>(false);

  const handleOpenPromptModal = (gap: ScoredGap) => {
    setSelectedPromptGap(gap);
    setIsPromptModalOpen(true);
  };

  const handleClosePromptModal = () => {
    setIsPromptModalOpen(false);
  };

  const handleDownloadAllPrompts = () => {
    if (!gapReport || gapReport.topGaps.length === 0) return;
    const batchContent = generateBatchAgenticPrompts(gapReport.topGaps);
    const blob = new Blob([batchContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geo-agent-prompts-all-gaps-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedBatch(true);
    setTimeout(() => setDownloadedBatch(false), 2200);
  };

  return (
    <section className="space-y-5 animate-fade-in" aria-labelledby="gap-report-heading">
      {/* Section header */}
      <div className="flex flex-wrap items-start justify-between gap-4 bg-surface-card border border-border-subtle rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 id="gap-report-heading" className="text-sm font-semibold text-text-heading">
              Topical Content Gaps
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-muted text-accent-text border border-accent/20">
              {gapReport.topGaps.length} Actionable Gaps
            </span>
          </div>
          <p className="text-xs text-text-muted max-w-2xl">
            Ranked by{" "}
            <code className="font-mono text-accent-text bg-accent-muted px-1.5 py-0.5 rounded">
              G = (D + C) × S / F
            </code>{" "}
            — recurring concept pairs that never co-occur on the same page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {gapReport.candidatesExcluded > 0 && (
            <div className="shrink-0 px-3 py-1.5 rounded-lg bg-warning-muted border border-warning/20 text-warning-text text-xs font-medium">
              ⚠ {gapReport.candidatesExcluded} pairs above cap not scored
            </div>
          )}

          {gapReport.topGaps.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAllPrompts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-overlay hover:bg-accent-muted border border-border-subtle hover:border-accent/40 text-xs font-medium text-text-muted hover:text-accent-text transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label="Download all Agentic IDE gap writing prompts"
            >
              {downloadedBatch ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success-text" aria-hidden="true" />
                  <span className="text-success-text">Prompts Downloaded!</span>
                </>
              ) : (
                <>
                  <Bot className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                  <span>Download All Prompts (.md)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Gap Cards */}
      <div className="space-y-4">
        {gapReport.topGaps.map((gap, idx) => {
          const cardKey = `gap_${idx}`;
          // Default to expanded for first 3, collapsed thereafter
          const isExpanded = expandedCards[cardKey] !== undefined
            ? expandedCards[cardKey]
            : idx < 3;

          return (
            <GapCard
              key={idx}
              gap={gap}
              index={idx}
              isExpanded={isExpanded}
              onToggleExpand={() => onToggleExpand(cardKey)}
              totalScannedPages={totalScannedPages}
              onOpenPromptModal={handleOpenPromptModal}
            />
          );
        })}
      </div>

      {/* Interactive Agentic IDE Prompt Modal */}
      <AgenticPromptModal
        isOpen={isPromptModalOpen}
        onClose={handleClosePromptModal}
        gap={selectedPromptGap}
        totalScannedPages={totalScannedPages}
      />
    </section>
  );
}
