import React from "react";
import { Search, ShieldCheck, TrendingUp, FileText } from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: FileText,
    color: "text-accent-text",
    bg: "bg-accent-muted",
    title: "Fetch & Extract",
    body: "Each URL is fetched and parsed for headings, metadata, JSON-LD, outbound links, and body copy.",
  },
  {
    icon: ShieldCheck,
    color: "text-success-text",
    bg: "bg-success-muted",
    title: "GEO Scorecard",
    body: "Every page is scored against research-validated GEO signals: citations, quotations, statistics, keyword density, schema, and meta description.",
  },
  {
    icon: Search,
    color: "text-secondary-text",
    bg: "bg-secondary-muted",
    title: "Algorithmic Topic Extraction",
    body: "TF-IDF phrase extraction identifies the key concepts on each page — no LLM calls in this step.",
  },
  {
    icon: TrendingUp,
    color: "text-accent-text",
    bg: "bg-accent-muted",
    title: "Gap Scoring via Gemini",
    body: "Concept pairs that never co-occur on the same page are scored by Depth, Connectivity, Search Demand, and Creation Friction using two focused Gemini calls.",
  },
];

export function EmptyState() {
  return (
    <section className="animate-fade-in" aria-label="How the tool works">
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-7 sm:p-10 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-widest font-semibold text-text-muted">
            How it works
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-text-heading">
            Paste URLs above and click <span className="text-accent-text">Run GEO Content Scan</span>
          </h2>
          <p className="text-sm text-text-muted max-w-xl mx-auto">
            Supports 1 URL for a single-page audit or 2–10 URLs for cross-page topical gap mapping.
            Results appear below within 15–30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map(({ icon: Icon, color, bg, title, body }, i) => (
            <div
              key={i}
              className="bg-surface-card border border-border-subtle rounded-xl p-5 space-y-3"
            >
              <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-heading">{title}</p>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">{body}</p>
              </div>
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-border-subtle text-text-muted text-xs font-mono font-bold">
                {i + 1}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-faint">
          Algorithmic extraction uses 0 LLM calls. Gap scoring uses 2 focused Gemini API calls.
        </p>
      </div>
    </section>
  );
}
