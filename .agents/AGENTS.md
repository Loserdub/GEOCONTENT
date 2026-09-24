# AGENTS.md — GEO Content Gap Checker

## Project Overview

Build a web app called the GEO Content Gap Checker. A user pastes one or more URLs, the app fetches and analyzes the content of those pages, and returns:
1. A per-page scorecard checking for research-validated GEO tactics and basic content structure
2. If 2+ URLs are given, a cross-page topic map and a ranked list of content gaps (topics the site's existing pages don't yet cover), scored by a gap-priority formula

Full product spec: `GEO_Content_Checker_Spec.md` in this repo. Read it before starting. It contains the exact detection logic, scoring formulas, and prioritization for each module.

This is an internal tool first. Build for correctness and clarity over polish. It will later be extended into a client-facing product, so keep the code modular enough that the scoring engine could be reused behind a different UI.

---

## Tech Stack (decided, do not deviate without asking)

- **Framework**: Next.js (App Router), TypeScript strict mode
- **Styling**: Tailwind CSS
- **HTML fetching/parsing**: `cheerio` for structural parsing, `@mozilla/readability` + `jsdom` for main-content extraction
- **Algorithmic Topic Extraction**: Local TF-IDF / phrase extraction (no LLM calls)
- **LLM calls** (topic gap scoring and prose justifications): Google Gemini API (`@google/generative-ai`), model `gemini-3.6-flash`. API key via `GEMINI_API_KEY` env var, never hardcoded. Chosen for cost and latency efficiency on this specific structured numeric scoring task. Note: future features requiring heavier complex reasoning may evaluate model/provider choice separately; this is not a project-wide permanent departure from Anthropic.
- **State/storage**: none required for MVP — each scan is stateless, request in, report out. If persistence is added later, use SQLite via `better-sqlite3` rather than standing up a separate DB service
- **Testing**: Vitest for the scoring/detection logic (Section 2.2, 2.3, 2.5 of the spec are pure functions — test them directly)

---

## Architecture

```
/app
  /api/scan/route.ts       -- POST endpoint: takes URL(s), returns scorecard(s) + gap report
  /page.tsx                 -- main UI: URL input, scan button, results display
/lib
  /fetch.ts                 -- URL fetching with timeout, robots.txt check, user-agent
  /extract.ts                -- content extraction (title, meta, body text, JSON-LD, headings)
  /extractors/
    topicExtraction.ts       -- algorithmic (TF-IDF/phrase) topic extraction (0 LLM calls)
  /detectors/
    citeSources.ts
    quotations.ts
    statistics.ts
    keywordStuffing.ts
    schemaValidation.ts
    metaDescription.ts
  /llm/
    gapScoringNumeric.ts     -- Pass 1: batched D/C/S/F numeric-only scoring via Gemini
    gapJustification.ts      -- Pass 2: prose justification for top-20 scored gaps via Gemini
    toneScoring.ts           -- fluency/authoritative qualitative scoring (deferred)
  /scoring.ts                 -- pure functions: gapScore(), visibilityScore()
  /gapMapping.ts               -- cross-page co-occurrence + candidate gap detection + orchestration
/types
  index.ts                   -- shared types: PageAnalysis, GapCandidate, ScoreInputs, etc.
```

Keep `/lib/scoring.ts` free of any fetching, parsing, or LLM calls. It should take plain numeric inputs and return numbers. This is the part most likely to be reused or unit-tested in isolation.

---

## Coding Standards

- TypeScript strict mode, no `any` unless genuinely unavoidable (external library types)
- Every exported function in `/lib` gets a docstring comment stating what it does and what it does NOT do (e.g., "estimates D/C/S/F via LLM call; does not fetch real backlink data")
- No unnecessary dependencies — check if `cheerio`/`readability`/`jsdom` already cover a need before adding a new package
- Fetching external URLs: always set a timeout (10s default), always check robots.txt before fetching, always identify with a real user-agent string (not a spoofed browser UA)

---

## Build Order (milestones)

1. **M1 — Fetch & Extract**: single URL in, structured content out (title, meta, body text, word count, JSON-LD, headings). No analysis yet. Verify against 2-3 real pages including trustnodelogic.com pages.
2. **M2 — Single-page scorecard**: implement all detectors in `/lib/detectors/`. Wire up the scan API and a basic results UI showing pass/fail per check.
3. **M3 — Scoring engine**: implement `gapScore()` and `visibilityScore()` as pure functions per the formulas in the spec (Section 2.5). Unit test with the worked examples from GEO_Gap_Analysis_Whitepaper.md.
4. **M4 — Multi-page topic mapping**: accept multiple URLs, run topic extraction per page via the LLM module, build the co-occurrence map, surface candidate gaps.
5. **M5 — Gap report UI**: ranked table, exportable to markdown.
6. **M6 (stretch)**: Google Search Console OAuth integration to pull real impression data as the S input instead of a manual estimate.

Do not skip ahead to M4+ before M1-M3 are working and tested. The scoring engine (M3) is the part with the least room for silent bugs — verify its output against the manual worked examples before building UI on top of it.

---

## Explicit Constraints (do not build these even if it seems like a natural extension)

- Do not add any feature that generates fabricated statistics, fake citations, fake quotes, or synthetic "consensus" content attributed to real or fictional sources. The tool's job is to detect and score what's genuinely present or genuinely estimable, not to manufacture the appearance of authority.
- Do not add a feature that scrapes or represents a competitor's content as belonging to the user, or that auto-publishes anything. This tool reports; it does not act on the user's behalf.
- Do not fabricate backlink or search-volume numbers when real data isn't available — show "not available, manual estimate required" rather than a plausible-looking placeholder number.

---

## Open Questions to Flag Back to the User (don't guess silently)

- Whether Google Search Console integration is in scope for v1 or deferred to M6
- Whether PDF export is needed for v1 or markdown-only is fine to start
- Rate limits / cost ceiling for LLM calls per scan (multi-page topic extraction makes one call per page; confirm acceptable cost before defaulting to unlimited URLs per scan — consider a sane cap like 10 URLs per scan for v1)
