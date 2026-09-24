"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import type { ScoredGap } from "@/types";
import {
  generateAgenticGapPrompt,
  calculateLAAZoneMetrics,
  generateSuggestedSlug,
} from "@/lib/gapPromptWriter";
import {
  X,
  Copy,
  Check,
  Download,
  Bot,
  Sparkles,
  Layers,
  FileCode,
  Sliders,
} from "lucide-react";

export interface AgenticPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  gap: ScoredGap | null;
  totalScannedPages?: number;
}

const PRESET_WORD_COUNTS = [1000, 1500, 2000, 2500];

export function AgenticPromptModal({
  isOpen,
  onClose,
  gap,
}: AgenticPromptModalProps) {
  const [wordCount, setWordCount] = useState<number>(1500);
  const [coreEntity, setCoreEntity] = useState<string>("Justin Ray / Trust Node Logic");
  const [targetFilename, setTargetFilename] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync default target filename when gap changes
  useEffect(() => {
    if (gap) {
      const slug = generateSuggestedSlug(gap.topicA, gap.topicB);
      setTargetFilename(`articles/${slug}.md`);
      setCopied(false);
    }
  }, [gap]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const metrics = useMemo(() => calculateLAAZoneMetrics(wordCount), [wordCount]);

  const generatedPrompt = useMemo(() => {
    if (!gap) return "";
    return generateAgenticGapPrompt(gap, {
      wordCount,
      coreEntity,
      targetFilename,
      customNotes,
    });
  }, [gap, wordCount, coreEntity, targetFilename, customNotes]);

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    if (!gap || !generatedPrompt) return;
    const slug = generateSuggestedSlug(gap.topicA, gap.topicB);
    const blob = new Blob([generatedPrompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-prompt-${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !gap) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agentic-prompt-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-surface-card border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden text-text-body animate-scale-up"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-border-subtle bg-surface-overlay/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent-muted border border-accent/30 flex items-center justify-center text-accent-text shrink-0">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="agentic-prompt-modal-title"
                  className="text-base sm:text-lg font-bold text-text-heading flex items-center gap-2"
                >
                  <span>Agentic IDE Gap-Filling Prompt</span>
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-white uppercase tracking-wider">
                  LAA-v2
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Targeting gap zone:{" "}
                <span className="font-mono font-semibold text-accent-text uppercase">
                  {gap.topicA}
                </span>{" "}
                ↔{" "}
                <span className="font-mono font-semibold text-secondary-text uppercase">
                  {gap.topicB}
                </span>{" "}
                (Score: {gap.G.toFixed(1)})
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-heading hover:bg-surface-raised transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-5 sm:px-6 border-b border-border-subtle bg-surface/50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            {/* Word Count Control */}
            <div className="sm:col-span-4 space-y-1.5">
              <label htmlFor="modal-word-count" className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-accent-text" />
                <span>Target Word Count</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="modal-word-count"
                  type="number"
                  min="300"
                  max="10000"
                  step="100"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value) || 1500)}
                  className="w-24 px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-lg text-xs font-mono text-text-heading focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <div className="flex items-center gap-1">
                  {PRESET_WORD_COUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWordCount(preset)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                        wordCount === preset
                          ? "bg-accent text-white shadow-sm"
                          : "bg-surface-overlay text-text-muted hover:text-text-heading border border-border-subtle"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Core Entity Input */}
            <div className="sm:col-span-4 space-y-1.5">
              <label htmlFor="modal-core-entity" className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-secondary-text" />
                <span>Core Entity to Anchor</span>
              </label>
              <input
                id="modal-core-entity"
                type="text"
                value={coreEntity}
                onChange={(e) => setCoreEntity(e.target.value)}
                placeholder="Justin Ray / Trust Node Logic"
                className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-lg text-xs text-text-heading focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Target Output File */}
            <div className="sm:col-span-4 space-y-1.5">
              <label htmlFor="modal-target-file" className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-success-text" />
                <span>Target Output File</span>
              </label>
              <input
                id="modal-target-file"
                type="text"
                value={targetFilename}
                onChange={(e) => setTargetFilename(e.target.value)}
                placeholder="articles/bridge-topic.md"
                className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-lg text-xs font-mono text-text-heading focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Custom Notes / Instructions */}
            <div className="sm:col-span-12 space-y-1.5">
              <label htmlFor="modal-custom-notes" className="text-xs font-semibold text-text-heading flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-accent-text" />
                <span>Custom Domain Notes / Special Instructions <span className="text-text-muted font-normal">(optional)</span></span>
              </label>
              <input
                id="modal-custom-notes"
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Emphasize C2PA music metadata and Suno v3.5 audio provenance standards"
                className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-lg text-xs text-text-heading focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Mathematical LAA-v2 Zone Distribution Metrics */}
          <div className="bg-surface-card rounded-xl p-3 border border-border-subtle grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-surface-overlay p-2 rounded-lg border border-border-subtle">
              <div className="text-[11px] text-text-muted">Total Words</div>
              <div className="font-mono font-bold text-text-heading text-sm mt-0.5">{metrics.targetWordCount}</div>
            </div>
            <div className="bg-surface-overlay p-2 rounded-lg border border-border-subtle">
              <div className="text-[11px] text-text-muted">Total $f_E$ Mentions</div>
              <div className="font-mono font-bold text-accent-text text-sm mt-0.5">{metrics.f_E} instances</div>
            </div>
            <div className="bg-surface-overlay p-2 rounded-lg border border-border-subtle">
              <div className="text-[11px] text-text-muted">Intro (15%)</div>
              <div className="font-mono font-medium text-text-heading text-xs mt-0.5">
                ~{metrics.introWords}w <span className="text-accent-text font-bold">({metrics.introEntityMentions} mentions)</span>
              </div>
            </div>
            <div className="bg-surface-overlay p-2 rounded-lg border border-border-subtle">
              <div className="text-[11px] text-text-muted">Technical Core (70%)</div>
              <div className="font-mono font-medium text-text-heading text-xs mt-0.5">
                ~{metrics.coreWords}w <span className="text-warning-text font-bold">(0 mentions)</span>
              </div>
            </div>
            <div className="bg-surface-overlay p-2 rounded-lg border border-border-subtle col-span-2 sm:col-span-1">
              <div className="text-[11px] text-text-muted">Outro (15%)</div>
              <div className="font-mono font-medium text-text-heading text-xs mt-0.5">
                ~{metrics.outroWords}w <span className="text-accent-text font-bold">({metrics.outroEntityMentions} mentions)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Content Preview Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:px-6 bg-surface/30">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-accent-text" />
                <span>Generated Agent Prompt (Copy into Antigravity IDE, Cursor, Windsurf, or Claude)</span>
              </span>
              <span className="text-[11px] font-mono text-text-faint">
                {generatedPrompt.length} chars
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-surface-overlay border border-border-subtle text-xs font-mono text-text-body overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
              {generatedPrompt}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-border-subtle bg-surface-overlay flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-muted hidden sm:block">
            Paste this prompt into your Agentic IDE to write a peer-grade article filling this gap zone.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none shadow-md shadow-accent/20 transition-all"
              aria-label="Copy prompt to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-white" aria-hidden="true" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>Copy Agentic Prompt</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-card border border-border-subtle text-xs font-semibold text-text-heading hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-all"
              aria-label="Download prompt as markdown file"
            >
              <Download className="h-4 w-4 text-accent-text" aria-hidden="true" />
              <span>Download .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
