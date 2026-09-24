# GEO Content Gap Checker — Product Spec

**Owner:** Justin Tyler Ray / Trust Node Logic
**Purpose:** Internal tool first, client-facing lead magnet later. User pastes one or more URLs; the tool scans the content and returns a scorecard plus a ranked gap report.
**References:** GEO_Master_Framework.md, GEO_Gap_Analysis_Whitepaper.md, latent-anchor-algorithm.md (LAA-v2)

---

## 1. Core User Flow

1. User pastes one or more URLs into a text field (one per line, or comma-separated)
2. User clicks "Scan"
3. Tool fetches each page, extracts content, runs analysis
4. Tool returns:
   - A per-page scorecard (validated-tactic checklist + structural checklist)
   - If 2+ URLs: a cross-page topic map and a ranked gap report (candidate topics not covered by any page, scored by the G formula)
5. User can export the report (markdown or PDF)

Single-URL scans get a scorecard only (no gap analysis possible with one data point). Multi-URL scans get both.

---

## 2. Analysis Modules

### 2.1 Content Extraction
- Fetch HTML (respect robots.txt, set a timeout, identify via a real user-agent string)
- Extract: title, meta description, canonical URL, main body text (strip nav/footer/ads), word count, heading structure (H1-H3), existing JSON-LD blocks
- Library choice: `@mozilla/readability` + `jsdom` for main-content extraction, `cheerio` for structural parsing

### 2.2 Validated GEO Tactic Detection
Based on measured effect sizes from Aggarwal et al. 2024 (GEO_Master_Framework.md Part 0.5 and 2.5). Ranked by priority to detect:

| Tactic | Detection method |
|---|---|
| Cite Sources | Outbound links to external domains, especially high-authority patterns (.gov, .edu, wikipedia.org, primary sources); in-text patterns like "according to," "(Source: X)" |
| Quotation Addition | Quotation marks with an attribution pattern nearby ("said," "explains," a named source) |
| Statistics Addition | Regex for percentages, numeric + unit patterns, "X out of Y," dated data points |
| Keyword Stuffing (flag, not reward) | Any single term/phrase exceeding a density threshold (e.g., >2-3% of total words) relative to body length |
| Fluency / Authoritative tone | Qualitative — not reliably regex-detectable. Use an LLM call (see 2.5) to score 0-10 with a one-line justification |

Each detected tactic gets a pass/fail or count in the scorecard, not a fabricated "score out of 100" — show what was found, not an opaque number.

### 2.3 Structural Analysis
- **Semantic abstract check**: does the first ~250 words form a self-contained paragraph naming the core topic and entity? (Word count + presence of entity name string in first paragraph)
- **Zone distribution (internal discipline, not a scored lever)**: rough entity-mention count in first 15% / middle 70% / last 15% of body text, reported as an FYI, not part of the pass/fail score, per the Part 2.2 research caveat in the Master Framework
- **Logical chain check**: count of transition phrases ("therefore," "this means," "as a result") at paragraph boundaries — informational only
- **Schema.org validation**: parse JSON-LD, confirm valid JSON, confirm `@type`, confirm any `sameAs` URLs actually resolve (HTTP HEAD request) rather than just existing as strings
- **Meta description check**: 120-155 characters, and identical across `<meta name="description">`, `og:description`, `twitter:description`
- **Style check**: flag em-dash characters (`—`, `&mdash;`) since that's a standing site rule

### 2.4 Multi-Page Topic Mapping (2+ URLs)
- Extract 5-10 core topics/entities per page. Use an LLM call (Claude) with a structured-output prompt rather than pure TF-IDF, since topic extraction benefits from actual understanding, not just term frequency
- Build a co-occurrence map: which topic pairs appear together on the same page, and which topics exist on the site but never appear together on any single page
- Topic pairs that exist separately but never co-occur are candidate gaps

### 2.5 Gap Scoring
For each candidate gap, estimate D, C, S, F (0-10 scale) and compute:

```
G = (D + C) × S / F
G_amplified = G × (1 + T)
```

- D, F: reasonably estimable from the existing content depth on each half of the gap and a rough word-count/complexity proxy
- S: if the user connects Google Search Console (OAuth, optional integration), pull real impression data for related queries; otherwise a manual 0-10 input
- C: manual input for MVP (real backlink data requires a paid API like Ahrefs/Moz; flag as a future integration, not MVP scope)
- T: manual input, defaults to 0 (evergreen) unless the user flags a deadline/event

Use an LLM call to draft the D/C/S/F justification in plain language so the user can sanity-check the number, not just trust a black box.

### 2.6 Report Output
- Per-page scorecard: tactic checklist, structural checklist, style checklist
- Cross-page gap table: candidate gap, G score, G_amplified, one-line rationale, sorted descending
- Export to markdown; PDF export as a stretch goal

---

## 3. Explicit Non-Goals (v1)

- No fabricated benchmarks, synthetic consensus content, or fake entity-relationship claims — the tool only reports what is actually present in the fetched content or genuinely estimable from real signals
- No real-time backlink data (needs a paid third-party API; defer)
- No automated content rewriting in v1 — the tool reports gaps and scores, it doesn't generate the replacement copy. That stays a human (or a separate, explicitly-labeled) step
- No scanning of pages behind auth/paywalls

---

## 4. Data & Privacy Notes

- Only fetch publicly accessible URLs the user supplies
- Respect robots.txt
- Rate-limit outbound fetches
- If Google Search Console integration is added, use OAuth scoped to read-only Search Console access, store tokens securely, and only pull data for properties the authenticated user actually owns
