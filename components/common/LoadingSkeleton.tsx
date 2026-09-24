import React from "react";

/** Full-area loading skeleton shown while a scan is in progress */
export function LoadingSkeleton({ urlCount }: { urlCount: number }) {
  return (
    <section
      className="space-y-6 animate-fade-in"
      aria-label="Scan in progress"
      aria-busy="true"
    >
      {/* Status banner with live status announcement */}
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 px-5 py-4 bg-surface-card border border-border-subtle rounded-xl"
      >
        <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
        </span>
        <p className="text-sm font-medium text-text-heading">
          Scanning {urlCount} URL{urlCount !== 1 ? "s" : ""}
          <span className="text-text-muted font-normal ml-1">
            — fetching, extracting, and running GEO analysis…
          </span>
        </p>
      </div>

      {/* KPI bar skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-card border border-border-subtle rounded-xl p-4 space-y-3">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-7 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="skeleton h-10 w-72 rounded-xl" aria-hidden="true" />

      {/* Card skeletons */}
      <div className="space-y-4" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-border-subtle flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-72 rounded" />
              </div>
              <div className="skeleton h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
