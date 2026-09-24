import React from "react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Sliders,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export interface ScanFormProps {
  urlInput: string;
  setUrlInput: (val: string) => void;
  customDomainsInput: string;
  setCustomDomainsInput: (val: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  isLoading: boolean;
  error: string | null;
  handleScan: (e: React.FormEvent) => void;
  handlePreset: (type: "cluster" | "single" | "wikipedia") => void;
}

export function ScanForm({
  urlInput,
  setUrlInput,
  customDomainsInput,
  setCustomDomainsInput,
  showAdvanced,
  setShowAdvanced,
  isLoading,
  error,
  handleScan,
  handlePreset,
}: ScanFormProps) {
  return (
    <section
      className="bg-surface-raised border border-border-subtle rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/40"
      aria-labelledby="scan-form-heading"
    >
      <form onSubmit={handleScan} className="space-y-5" noValidate>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <label
              htmlFor="urls"
              id="scan-form-heading"
              className="block text-sm font-semibold text-text-heading"
            >
              Target URLs for Analysis
            </label>
            <p className="text-xs text-text-muted mt-1">
              Paste 1 URL for a single-page scorecard, or 2–10 URLs for cross-page gap mapping.
            </p>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="URL presets">
            <span className="text-xs text-text-muted font-medium">Presets:</span>
            {(
              [
                ["cluster", "TrustNode Cluster (6)", "Load 6 TrustNode cluster URLs"],
                ["single", "Single Page", "Load single page URL"],
                ["wikipedia", "SEO & AI Wiki (2)", "Load 2 Wikipedia articles"],
              ] as const
            ).map(([type, label, ariaLabel]) => (
              <button
                key={type}
                type="button"
                onClick={() => handlePreset(type)}
                aria-label={ariaLabel}
                className="text-xs px-2.5 py-1 rounded-md bg-surface-card hover:bg-border-subtle text-text-muted hover:text-text-heading border border-border-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            id="urls"
            rows={4}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={"https://example.com/page1\nhttps://example.com/page2"}
            className="w-full rounded-xl border border-border-subtle bg-surface-overlay px-4 py-3 text-sm text-text-heading placeholder:text-text-faint focus:border-border-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono transition resize-y leading-relaxed"
            required
            aria-required="true"
            aria-describedby="urls-hint"
          />
          <p id="urls-hint" className="mt-1.5 text-xs text-text-muted">
            One URL per line. Maximum 10 URLs per scan.
          </p>
        </div>

        {/* Advanced Settings Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-heading focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-md px-1.5 py-1 -ml-1.5 transition-colors"
            aria-expanded={showAdvanced}
            aria-controls="advanced-settings"
            aria-label={
              showAdvanced
                ? "Hide advanced settings: custom authority domains"
                : "Show advanced settings: custom authority domains"
            }
          >
            <Sliders className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
            <span>
              {showAdvanced
                ? "Hide Advanced Settings"
                : "Advanced Settings — Custom Authority Domains"}
            </span>
            {showAdvanced ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>

          {showAdvanced && (
            <div
              id="advanced-settings"
              className="mt-3 p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-2 animate-slide-in"
            >
              <label htmlFor="customDomains" className="block text-xs font-medium text-text-heading">
                Custom Niche Authority Domains{" "}
                <span className="text-text-muted font-normal">(optional, comma-separated)</span>
              </label>
              <input
                id="customDomains"
                type="text"
                value={customDomainsInput}
                onChange={(e) => setCustomDomainsInput(e.target.value)}
                placeholder="e.g. musicbrainz.org, soundcloud.com, acrcloud.com"
                className="w-full rounded-lg border border-border-subtle bg-surface-card px-3 py-2 text-xs text-text-heading placeholder:text-text-faint focus:border-border-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono"
                aria-describedby="custom-domains-hint"
              />
              <p id="custom-domains-hint" className="text-xs text-text-muted">
                Outbound links to these domains will count as high-authority citations.
              </p>
            </div>
          )}
        </div>

        {/* Scan Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-subtle">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/25 hover:shadow-accent/40 hover:from-accent-hover hover:to-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Scanning…</span>
              </>
            ) : (
              <>
                <Target className="h-4 w-4" aria-hidden="true" />
                <span>Run GEO Content Scan</span>
              </>
            )}
          </button>

          <p className="text-xs text-text-muted hidden sm:block">
            Algorithmic extraction + 2-pass Gemini scoring
          </p>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-5 rounded-xl bg-danger-muted border border-danger/30 p-4 flex items-start gap-3"
        >
          <AlertCircle className="h-4 w-4 text-danger-text shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-danger-text">Scan failed</p>
            <p className="text-xs text-text-heading">{error}</p>
            <p className="text-xs text-text-muted">
              Check that all URLs are reachable and start with <code className="font-mono bg-surface-card px-1 py-0.5 rounded">https://</code>.
              If a site blocks our crawler via robots.txt, try another URL.{" "}
              <a
                href="https://en.wikipedia.org/wiki/Robots_exclusion_standard"
                target="_blank"
                rel="noreferrer"
                className="text-accent-text hover:underline inline-flex items-center gap-0.5 focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                What is robots.txt?
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
