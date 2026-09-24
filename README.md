# GEO Content Gap Checker & Scorecard Analyzer

> **Generative Engine Optimization (GEO) audit engine and multi-page content gap mapping tool.**  
> Created by **Justin Ray** ([Trust Node Logic](https://trustnodelogic.com)) to evaluate web content against empirical generative search optimization tactics and uncover high-priority topic gaps across site clusters.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Author & Knowledge Graph Attribution](#author--knowledge-graph-attribution)
- [JSON-LD Entity Graph](#json-ld-entity-graph)
- [Core Features](#core-features)
  - [1. Single-Page GEO Scorecard](#1-single-page-geo-scorecard)
  - [2. Multi-Page Topic Mapping & Gap Detection](#2-multi-page-topic-mapping--gap-detection)
  - [3. 2-Pass Hybrid Gemini Scoring Engine](#3-2-pass-hybrid-gemini-scoring-engine)
  - [4. GEO Agentic IDE Prompt Writer](#4-geo-agentic-ide-prompt-writer)
  - [5. Bring Your Own Key (BYOK) Architecture](#5-bring-your-own-key-byok-architecture)
- [The GEO Scoring Formula](#the-geo-scoring-formula)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [API Key Configuration](#api-key-configuration)
  - [Running the Development Server](#running-the-development-server)
  - [Running Tests](#running-tests)
  - [Production Build](#production-build)
- [Ethical Constraints & Guardrails](#ethical-constraints--guardrails)
- [License](#license)

---

## Overview

As generative AI engines (Google AI Overviews, Perplexity, ChatGPT Search, Claude) transform information retrieval, traditional search engine optimization (SEO) is evolving into **Generative Engine Optimization (GEO)**.

The **GEO Content Gap Checker** was engineered by **Justin Tyler Ray** at [Trust Node Logic](https://trustnodelogic.com) as a research-validated audit pipeline:
1. **Audits individual URLs** against empirical tactics proven to increase AI engine citation rates (authoritative citations, speaker quotations, empirical statistics, clean schema, optimal semantic abstracts).
2. **Cross-examines multi-page clusters (2–10 URLs)** to construct a topical co-occurrence map and surface unbridged content opportunities (topics that appear on the domain but never together on the same page).
3. **Prioritizes content gaps** using an algorithmic priority formula ($G$ and $G_{\text{amplified}}$), augmented with 2-pass Google Gemini 3.6 Flash scoring.
4. **Generates Agentic IDE Prompts** formatted with Latent Anchor Algorithm (LAA-v2) target zones to streamline writing gap-filling content for modern AI coding and writing environments.

---

## Author & Knowledge Graph Attribution

This project is part of the **Trust Node Logic** research and technology ecosystem founded by **Justin Ray** (JRAY / loserdub):

- **Creator & Author**: Justin Ray (Justin Tyler Ray)
- **Organization**: [Trust Node Logic](https://trustnodelogic.com) (`https://trustnodelogic.com/#organization`)
- **Primary Hub**: [trustnodelogic.com](https://trustnodelogic.com)
- **Source Repository & Knowledge Graph**: Grounded in the entity architecture defined at [VISIONMAIN](https://github.com/loserdub/VISIONMAIN) (`https://trustnodelogic.com/#person`, `https://trustnodelogic.com/#website`).
- **Research Domains**:
  - *Hybrid AI Music Production* & Digital Audio Workstation integration
  - *Hybrid Production Standard (HPS-1.0)* & C2PA music provenance metadata
  - *Generative Engine Optimization (GEO)* & Latent Anchor Algorithm (LAA-v2)
  - *MIXR Studio* audio DSP and post-AI sound design

---

## JSON-LD Entity Graph

The following structured schema links this software directly back to the canonical entity identifiers defined in the source knowledge graph at **trustnodelogic.com**:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://trustnodelogic.com/geo-content-gap-checker/#software",
      "name": "GEO Content Gap Checker",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": "https://trustnodelogic.com",
      "description": "Generative Engine Optimization (GEO) audit engine, scorecard validator, and cross-page topic gap analyzer for modern AI search engines.",
      "author": {
        "@id": "https://trustnodelogic.com/#person"
      },
      "creator": {
        "@id": "https://trustnodelogic.com/#person"
      },
      "publisher": {
        "@id": "https://trustnodelogic.com/#organization"
      },
      "isPartOf": {
        "@id": "https://trustnodelogic.com/#website"
      }
    },
    {
      "@type": "Person",
      "@id": "https://trustnodelogic.com/#person",
      "name": "Justin Ray",
      "additionalName": "Justin Tyler Ray",
      "alternateName": [
        "JRAY",
        "loserdub",
        "VISION",
        "Flawed Future",
        "le vide",
        "disarray"
      ],
      "url": "https://trustnodelogic.com",
      "image": "https://trustnodelogic.com/bio-avatar.jpg",
      "email": "mailto:trustnodelogic@gmail.com",
      "jobTitle": [
        "Music Producer",
        "Music Artist",
        "Pioneer of Hybrid AI Music Production",
        "Audio Engineer",
        "Creative Technologist"
      ],
      "knowsAbout": [
        "Hybrid Music Production",
        "Generative Artificial Intelligence",
        "Digital Audio Workstation",
        "Audio Engineering",
        "Search Engine Optimization",
        "Generative Engine Optimization",
        "Knowledge Graph",
        "C2PA",
        "Hybrid Production Standard",
        "HPS-1.0",
        "MIXR Studio"
      ],
      "memberOf": [
        {
          "@id": "https://trustnodelogic.com/#organization"
        },
        {
          "@id": "https://www.reddit.com/r/hybridproduction/#organization"
        }
      ],
      "sameAs": [
        "https://musicbrainz.org/artist/882fdb9b-8655-45dd-8e24-a59cd750d053",
        "https://soundcloud.com/visiontracks",
        "https://www.youtube.com/@loserdub",
        "https://www.linkedin.com/in/jray-me/",
        "https://x.com/TheInnerVision",
        "https://www.instagram.com/jray.me/",
        "https://open.spotify.com/artist/3VZelnnW9OR0DyR2qRn4Oq",
        "https://open.spotify.com/artist/6GGZwLOLxVxYGOcMry3NDi",
        "https://open.spotify.com/artist/42TmrCeIumkPRyTNOPP78t",
        "https://open.spotify.com/artist/3FNFzRyU0PCA2vjihWsg6y",
        "https://open.spotify.com/artist/6TlAxGL1Hm4FRWfTxprlMi",
        "https://www.reddit.com/r/hybridproduction/",
        "https://network.landr.com/users/vision-hybrid",
        "https://github.com/loserdub"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://trustnodelogic.com/#organization",
      "name": "Trust Node Logic",
      "alternateName": "JRAY & Trust Node Logic",
      "url": "https://trustnodelogic.com",
      "logo": "https://trustnodelogic.com/favicon.png",
      "founder": {
        "@id": "https://trustnodelogic.com/#person"
      },
      "slogan": "The Frontier of Hybrid AI Music Production & Creative Technology",
      "knowsAbout": [
        "Hybrid Production",
        "Generative Engine Optimization",
        "AI Music Generation",
        "Audio Engineering",
        "Generative Audio Workflows",
        "HPS-1.0 Metadata Verification"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://trustnodelogic.com/#website",
      "url": "https://trustnodelogic.com",
      "name": "Trust Node Logic | Pioneer of Hybrid AI Music Production",
      "description": "Creative home and laboratory of Justin Ray (JRAY / loserdub), exploring hybrid music production, audio DSP tools, and post-AI sound design.",
      "author": {
        "@id": "https://trustnodelogic.com/#person"
      },
      "publisher": {
        "@id": "https://trustnodelogic.com/#organization"
      },
      "inLanguage": "en-US"
    }
  ]
}
```

---

## Core Features

### 1. Single-Page GEO Scorecard
Evaluates individual pages against research-backed levers (based on effect sizes from *Aggarwal et al. 2024*):

- **Cite Sources**: Detects outbound links to external domains, academic journals, government/educational portals, and in-text attribution patterns (`according to`, `source:`).
- **Quotation Addition**: Extracts direct quotations and verifies nearby speaker attribution (`said`, `explains`, author titles).
- **Statistics Addition**: Flags empirical metrics, percentages, ratios, and dated statistical data points.
- **Keyword Stuffing Guard**: Calculates term frequency-density distributions to guard against over-optimization penalties ($>2.5\%$ density flag).
- **Schema.org JSON-LD Validation**: Validates JSON-LD structure, verifies `@type` definitions, and checks `sameAs` entity references.
- **Meta Description & Headings**: Checks length optimization (120–155 chars) and cross-platform consistency (`meta name`, `og:description`, `twitter:description`).
- **Semantic Abstract & Flow**: Evaluates the opening ~250 words for self-contained entity anchoring and analyzes transitional logical chains.

---

### 2. Multi-Page Topic Mapping & Gap Detection
When scanning 2 to 10 URLs across a site or topic cluster:
- **Algorithmic Topic Extraction (Zero LLM Overhead)**: Uses local TF-IDF and keyphrase extraction to identify 5–10 core topics per page.
- **Cross-Page Co-occurrence Matrix**: Identifies which topics share a page vs. which topics appear on the site but **never co-occur on the same page**.
- **Candidate Gap Pre-filtering**: Ranks candidate topic pairs by cross-page frequency and total word count.

---

### 3. 2-Pass Hybrid Gemini Scoring Engine
To combine algorithmic speed with semantic reasoning:
- **Pass 1 (Batched Numeric Scoring)**: Sends pre-ranked candidate topic pairs in a single batch call to Gemini 3.6 Flash to score $D$ (Depth), $C$ (Connectivity), $S$ (Search Intent), and $F$ (Creation Friction) on a 0–10 scale.
- **Pure Formula Calculation**: Calculates priority score $G$ and time-urgency amplified score $G_{\text{amplified}}$ using pure functions in TypeScript.
- **Pass 2 (Batched Prose Justifications)**: Generates concise, professional one-line justifications for the top 20 content gaps in a single follow-up call.

---

### 4. GEO Agentic IDE Prompt Writer
For each discovered gap, generate copy-ready prompts tailored for AI coding assistants and content agents:
- **LAA-v2 Zoning**: Automatically computes target word counts and entity mention distribution (Intro 15%, Core 70%, Outro 15%).
- **Structured Strategy**: Outlines target file paths, semantic anchors, citation plans, and required structural components.
- **Batch Export**: Download all gap prompts as a unified Markdown document or copy individual prompts with one click.

---

### 5. Bring Your Own Key (BYOK) Architecture
- **Interactive UI Bar**: Users can enter their Google Gemini API key directly in the web UI.
- **Local Storage Security**: Stored securely in the browser's `localStorage` (`geo_gemini_api_key`) and sent strictly via HTTPS headers/payload during active scans.
- **No Database Persistence**: Keys are never logged, stored in databases, or shared with third parties.
- **Graceful Fallback**: If no key is configured, algorithmic topic mapping and scorecards still execute with full functionality.

---

## The GEO Scoring Formula

Content gaps are prioritized using the research-validated formula:

$$G = \frac{(D + C) \cdot S}{F}$$

$$G_{\text{amplified}} = G \cdot (1 + T)$$

| Variable | Name | Scale | Description |
|---|---|---|---|
| **$D$** | Topical Depth | 0 – 10 | Ecosystem depth potential and synergy between the two topics |
| **$C$** | Predicted Connectivity | 0 – 10 | Likelihood of earning authoritative backlinks, citations, and mentions |
| **$S$** | Search Intent / Demand | 0 – 10 | Audience search intent, industry interest, or query volume proxy |
| **$F$** | Creation Friction | 1 – 10 | Research, technical complexity, and editorial effort required (minimum 1) |
| **$T$** | Time-Urgency Factor | 0 – 2.0 | Time-sensitivity multiplier (0 = evergreen, >0 = urgent news/product release) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Components & Route Handlers) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (Custom WCAG 2.1 AA palette, dark surface tokens) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Content Extraction** | `@mozilla/readability`, `jsdom`, `cheerio`, `robots-parser` |
| **AI / LLM** | Google Gemini API (`@google/generative-ai`), model `gemini-3.6-flash` |
| **Testing** | [Vitest](https://vitest.dev/), `axe-core` for automated accessibility audits |

---

## Project Architecture

```
geo-content-gap-checker/
├── app/
│   ├── api/
│   │   └── scan/
│   │       └── route.ts          # POST endpoint: concurrency-controlled fetch, detectors, & LLM pipeline
│   ├── globals.css               # Design system tokens and accessibility utilities
│   ├── layout.tsx                # App root layout with canonical JSON-LD entity graph
│   └── page.tsx                  # Interactive single-page dashboard application
├── components/
│   ├── common/
│   │   ├── EmptyState.tsx        # Zero-state placeholder with quick-start guidance
│   │   └── LoadingSkeleton.tsx   # Accessible animated shimmer state
│   ├── gaps/
│   │   ├── AgenticPromptModal.tsx# Modal for customized LAA-v2 writing prompts
│   │   └── GapReportView.tsx     # Ranked gap table with collapsible justification cards
│   ├── layout/
│   │   └── Header.tsx            # Sticky header with real-time BYOK status pill
│   ├── scan/
│   │   ├── ApiKeyBar.tsx         # Expandable BYOK manager with localStorage sync & visibility toggle
│   │   ├── KpiSummary.tsx        # Top-level scan metrics (pages, gaps, pass rate)
│   │   ├── ScanForm.tsx          # Multi-URL input, presets, and advanced authority domain settings
│   │   └── ViewSwitcher.tsx      # Tab controls & Markdown / Prompt batch export actions
│   └── scorecards/
│       ├── ScorecardView.tsx     # Multi-page selector & scorecard inspector
│       ├── StructuralChecklist.tsx # Schema, meta, abstract, and zone distribution audits
│       └── TacticChecklist.tsx   # Citations, quotes, statistics, and keyword stuffing audits
├── lib/
│   ├── detectors/                # Pure detection functions
│   │   ├── citeSources.ts        # Outbound link and in-text citation heuristics
│   │   ├── keywordStuffing.ts    # Unigram & bigram frequency-density calculations
│   │   ├── metaDescription.ts    # Character length & cross-tag parity checks
│   │   ├── quotations.ts         # Direct quote & attribution regex patterns
│   │   ├── schemaValidation.ts   # JSON-LD syntax & sameAs structure analysis
│   │   ├── statistics.ts         # Numeric metrics, percentages, and data points
│   │   └── structuralChecks.ts   # Abstract entity density, zones, & logical transitions
│   ├── extract.ts                # Main body & metadata extraction via Readability + Cheerio
│   ├── extractors/
│   │   └── topicExtraction.ts    # Algorithmic TF-IDF & phrase extraction (0 LLM cost)
│   ├── exportMarkdown.ts         # Clean Markdown report serializer
│   ├── fetch.ts                  # Safe URL fetching with timeout & robots.txt compliance
│   ├── gapMapping.ts             # Co-occurrence matrix, candidate ranking, & report assembly
│   ├── gapPromptWriter.ts        # LAA-v2 prompt generator for AI writing agents
│   ├── llm/
│   │   ├── gapJustification.ts   # Pass 2: Batched Gemini prose justifications
│   │   └── gapScoringNumeric.ts  # Pass 1: Batched Gemini D/C/S/F numeric scoring
│   └── scoring.ts                # Pure math functions for G and G_amplified
├── test/
│   ├── accessibility.test.tsx    # axe-core WCAG 2.1 AA automated audits
│   ├── detectors.test.ts         # Unit tests for all tactic & structural checks
│   ├── exportMarkdown.test.ts    # Markdown generation tests
│   ├── extract.test.ts           # Readability & HTML extraction tests
│   ├── fetch.test.ts             # Robots.txt and network fetching tests
│   ├── gapMapping.test.ts        # Co-occurrence and candidate pre-filtering tests
│   ├── gapPromptWriter.test.ts   # LAA-v2 prompt formatting tests
│   ├── llm.test.ts               # Gemini API batching, fallback, and retry tests
│   ├── scanRoute.test.ts         # API route integration tests
│   └── scoring.test.ts           # Whitepaper worked-example verification tests
├── types/
│   └── index.ts                  # Shared TypeScript types and interfaces
├── GEO_Content_Checker_Spec.md   # Architectural & product specification
├── GEO_Gap_Analysis_Whitepaper.md# Academic & mathematical foundations
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.17.0 or higher
- `npm` (bundled with Node.js)

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd geocontent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### API Key Configuration

The GEO Content Gap Checker supports **two convenient ways** to configure your Google Gemini API key:

#### Option A: Enter via Web UI (Recommended)
Launch the application and enter your key in the **Gemini API Key (BYOK)** bar at the top of the page.
- Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).
- Stored exclusively in your browser's `localStorage`—no file edits required.

#### Option B: Environment Variable (Optional)
If running in a self-hosted or automated server environment:
1. Copy the sample environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and paste your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

*(Note: If a key is entered in the UI bar, it takes precedence over `.env.local`.)*

### Running the Development Server

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

Run the Vitest test suite (including detector unit tests, mathematical formula checks, and axe-core accessibility audits):
```bash
npm test
```

### Production Build

Create an optimized production build and test bundle validity:
```bash
npm run build
npm run start
```

---

## Ethical Constraints & Guardrails

- **No Synthetic Authority**: The tool never generates fabricated statistics, fake citations, or synthetic "consensus" quotes. It audits what is authentically present in the analyzed content.
- **Respectful Crawling**: External page fetches strictly adhere to `robots.txt` exclusion rules, enforce a 10-second timeout, and identify via an honest `GEO-Content-Checker/1.0` User-Agent string.
- **No Unauthorized Publishing**: The system reports diagnostic findings and actionable content gap prompts; it does not scrape or publish content on your behalf.

---

## License

MIT License © 2026 Justin Tyler Ray / [Trust Node Logic](https://trustnodelogic.com)
