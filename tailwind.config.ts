import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        // Semantic surface tokens
        surface: {
          DEFAULT: "hsl(222 47% 6%)",    // deepest bg: #080d1a
          raised: "hsl(222 40% 8%)",     // main card bg: #0c1220
          card: "hsl(222 35% 11%)",      // inner card bg: #121826
          overlay: "hsl(222 44% 5%)",    // textarea / code bg: #070b15
        },
        // Semantic border tokens
        border: {
          subtle: "hsl(222 25% 18%)",    // default border
          focus:  "hsl(248 80% 60%)",    // focus ring color
          strong: "hsl(222 20% 28%)",    // hover/active border
        },
        // Accent (indigo-violet brand)
        accent: {
          DEFAULT:  "hsl(248 80% 60%)",  // indigo-600 equiv
          hover:    "hsl(248 80% 65%)",
          muted:    "hsl(248 60% 60% / 0.15)",
          text:     "hsl(248 85% 75%)",  // indigo-300 equiv (7.5:1 contrast)
        },
        // Semantic semantic tones
        success: {
          DEFAULT:  "hsl(158 64% 52%)",  // emerald-500
          muted:    "hsl(158 64% 52% / 0.15)",
          text:     "hsl(158 64% 62%)",  // emerald-400 (10.1:1 contrast)
        },
        warning: {
          DEFAULT:  "hsl(38 92% 50%)",   // amber-500
          muted:    "hsl(38 92% 50% / 0.15)",
          text:     "hsl(38 92% 62%)",   // amber-400 (10.0:1 contrast)
        },
        danger: {
          DEFAULT:  "hsl(0 72% 51%)",    // rose-500
          muted:    "hsl(0 72% 51% / 0.15)",
          text:     "hsl(0 72% 67%)",    // rose-400 (6.1:1 contrast)
        },
        // Text tokens (WCAG 2.1 AA calibrated >= 4.5:1 on all surface tokens)
        text: {
          heading: "hsl(210 40% 98%)",   // near-white (18.8:1 contrast)
          body:    "hsl(217 19% 80%)",   // slate-200 (12.2:1 contrast)
          muted:   "hsl(215 20% 68%)",   // slate-300 (7.3:1 contrast)
          faint:   "hsl(215 16% 62%)",   // slate-400 (6.0:1 contrast - passes WCAG AA)
        },
        // Violet secondary (topic B, etc.)
        secondary: {
          DEFAULT: "hsl(268 78% 65%)",   // violet-500
          muted:   "hsl(268 78% 65% / 0.15)",
          text:    "hsl(268 80% 75%)",   // violet-400 (7.5:1 contrast)
        },
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in": "slide-in 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
