"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { ScanResultPayload, GapReport } from "@/types";
import { generateMarkdownReport } from "@/lib/exportMarkdown";
import { generateBatchAgenticPrompts } from "@/lib/gapPromptWriter";
import { Header } from "@/components/layout/Header";
import { ApiKeyBar } from "@/components/scan/ApiKeyBar";
import { ScanForm } from "@/components/scan/ScanForm";
import { KpiSummary } from "@/components/scan/KpiSummary";
import { ViewSwitcher } from "@/components/scan/ViewSwitcher";
import { GapReportView } from "@/components/gaps/GapReportView";
import { ScorecardView } from "@/components/scorecards/ScorecardView";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";

const DEFAULT_PRESET_CLUSTER = [
  "https://trustnodelogic.com/what-is-hybrid.html",
  "https://trustnodelogic.com/hybridproductionstandard.html",
  "https://trustnodelogic.com/sunonewtos.html",
  "https://trustnodelogic.com/Suno101.html",
  "https://trustnodelogic.com/c2pa-music-provenance.html",
  "https://trustnodelogic.com/agentichybridproduction.html",
].join("\n");

const API_KEY_STORAGE_KEY = "geo_gemini_api_key";

export default function Home() {
  const [urlInput, setUrlInput] = useState<string>(DEFAULT_PRESET_CLUSTER);
  const [customDomainsInput, setCustomDomainsInput] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeyBarOpen, setIsApiKeyBarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEverScanned, setHasEverScanned] = useState<boolean>(false);
  const [liveStatus, setLiveStatus] = useState<string>("");

  // Load saved API key from localStorage on client mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const handleApiKeyChange = useCallback((newKey: string) => {
    setApiKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  const [results, setResults] = useState<ScanResultPayload[] | null>(null);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);
  const [activeView, setActiveView] = useState<"gaps" | "scorecards">("gaps");
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [copiedPrompts, setCopiedPrompts] = useState<boolean>(false);

  // Derive URL count for skeleton and live region announcements
  const urlCount = useMemo(
    () =>
      urlInput
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.length > 0).length,
    [urlInput]
  );

  const toggleExpand = useCallback((key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handlePreset = useCallback((type: "cluster" | "single" | "wikipedia") => {
    if (type === "cluster") {
      setUrlInput(DEFAULT_PRESET_CLUSTER);
    } else if (type === "single") {
      setUrlInput("https://trustnodelogic.com");
    } else if (type === "wikipedia") {
      setUrlInput(
        "https://en.wikipedia.org/wiki/Search_engine_optimization\nhttps://en.wikipedia.org/wiki/Generative_artificial_intelligence"
      );
    }
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setHasEverScanned(true);
    setResults(null);
    setGapReport(null);
    setExpandedCards({});
    setLiveStatus(`Starting scan of ${urlCount} URL${urlCount !== 1 ? "s" : ""}. Fetching and extracting page structure...`);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: urlInput,
          customAuthorityDomains: customDomainsInput,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to scan URLs.");
      }

      setResults(data.results);
      setGapReport(data.gapReport || null);
      setSelectedPageIndex(0);

      const gapsFound = data.gapReport?.topGaps?.length ?? 0;
      const pagesScanned = data.results?.length ?? 0;
      setLiveStatus(`Scan complete. Analyzed ${pagesScanned} pages. Identified ${gapsFound} content gaps.`);

      if (data.gapReport && data.gapReport.topGaps && data.gapReport.topGaps.length > 0) {
        setActiveView("gaps");
      } else {
        setActiveView("scorecards");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setLiveStatus(`Scan failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = useCallback(() => {
    if (!results) return;
    const mdContent = generateMarkdownReport(results, gapReport);
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geo-content-gap-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLiveStatus("Markdown report downloaded.");
  }, [results, gapReport]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!results) return;
    const mdContent = generateMarkdownReport(results, gapReport);
    await navigator.clipboard.writeText(mdContent);
    setCopiedMd(true);
    setLiveStatus("Markdown report copied to clipboard.");
    setTimeout(() => setCopiedMd(false), 2000);
  }, [results, gapReport]);

  const handleCopyAllPrompts = useCallback(async () => {
    if (!gapReport || gapReport.topGaps.length === 0) return;
    const batchContent = generateBatchAgenticPrompts(gapReport.topGaps);
    await navigator.clipboard.writeText(batchContent);
    setCopiedPrompts(true);
    setLiveStatus("All Agentic IDE gap writing prompts copied to clipboard.");
    setTimeout(() => setCopiedPrompts(false), 2000);
  }, [gapReport]);

  const handleDownloadAllPrompts = useCallback(() => {
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
    setLiveStatus("All Agentic IDE prompts downloaded.");
  }, [gapReport]);

  const totalScanned = useMemo(() => (results ? results.length : 0), [results]);
  const successfulScans = useMemo(
    () => (results ? results.filter((r) => r.success).length : 0),
    [results]
  );
  const totalGapsCount = useMemo(
    () => (gapReport ? gapReport.topGaps.length : 0),
    [gapReport]
  );
  const recurringTopicsCount = useMemo(
    () => (gapReport ? gapReport.recurringTopics.length : 0),
    [gapReport]
  );

  const avgPassRate = useMemo(() => {
    if (!results || successfulScans === 0) return 0;
    let totalChecks = 0;
    let passedChecks = 0;
    for (const r of results) {
      if (r.scorecard) {
        totalChecks += 4;
        if (r.scorecard.tactics.citeSources.passed) passedChecks++;
        if (r.scorecard.tactics.quotations.passed) passedChecks++;
        if (r.scorecard.tactics.statistics.passed) passedChecks++;
        if (r.scorecard.tactics.keywordStuffing.passed) passedChecks++;
      }
    }
    return totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  }, [results, successfulScans]);

  return (
    <div className="min-h-screen bg-surface text-text-body">
      <Header
        apiKey={apiKey}
        onToggleApiKey={() => setIsApiKeyBarOpen((prev) => !prev)}
      />

      {/* Screen Reader Live Announcement Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveStatus}
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 focus:outline-none"
      >
        {/* Unique page h1 (visually hidden; semantic for a11y / SEO) */}
        <h1 className="sr-only">GEO Content Gap Checker — Audit Pages for GEO Tactics</h1>

        {/* Bring Your Own Key (BYOK) Bar */}
        <ApiKeyBar
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
          isOpen={isApiKeyBarOpen}
          onToggleOpen={() => setIsApiKeyBarOpen((prev) => !prev)}
        />

        <ScanForm
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          customDomainsInput={customDomainsInput}
          setCustomDomainsInput={setCustomDomainsInput}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          isLoading={isLoading}
          error={error}
          handleScan={handleScan}
          handlePreset={handlePreset}
        />

        {/* Loading skeleton — shown while scan is in flight */}
        {isLoading && <LoadingSkeleton urlCount={urlCount} />}

        {/* Results — shown once scan completes */}
        {!isLoading && results && (
          <section
            id="results-section"
            className="space-y-6 animate-fade-in"
            aria-label="Scan results and gap analysis"
          >
            <KpiSummary
              totalScanned={totalScanned}
              successfulScans={successfulScans}
              totalGapsCount={totalGapsCount}
              recurringTopicsCount={recurringTopicsCount}
              avgPassRate={avgPassRate}
            />

            <ViewSwitcher
              activeView={activeView}
              setActiveView={setActiveView}
              hasGaps={Boolean(gapReport && gapReport.topGaps.length > 0)}
              gapCount={gapReport ? gapReport.topGaps.length : 0}
              resultCount={results.length}
              copiedMd={copiedMd}
              onCopyMarkdown={handleCopyMarkdown}
              onDownloadMarkdown={handleDownloadMarkdown}
              copiedPrompts={copiedPrompts}
              onCopyAllPrompts={handleCopyAllPrompts}
              onDownloadAllPrompts={handleDownloadAllPrompts}
            />

            {/* Gap Report Tab Panel */}
            {activeView === "gaps" && gapReport && (
              <div
                role="tabpanel"
                id="tabpanel-gaps"
                aria-labelledby="tab-gaps"
                tabIndex={0}
                className="focus:outline-none"
              >
                <GapReportView
                  gapReport={gapReport}
                  expandedCards={expandedCards}
                  onToggleExpand={toggleExpand}
                  totalScannedPages={results.length}
                />
              </div>
            )}

            {/* Scorecards Tab Panel */}
            {(activeView === "scorecards" || !gapReport || gapReport.topGaps.length === 0) && (
              <div
                role="tabpanel"
                id="tabpanel-scorecards"
                aria-labelledby="tab-scorecards"
                tabIndex={0}
                className="focus:outline-none"
              >
                <ScorecardView
                  results={results}
                  selectedPageIndex={selectedPageIndex}
                  onSelectPage={setSelectedPageIndex}
                />
              </div>
            )}
          </section>
        )}

        {/* Empty state — shown before the first scan attempt */}
        {!isLoading && !hasEverScanned && <EmptyState />}
      </main>
    </div>
  );
}
