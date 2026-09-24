import { checkStatistics, checkStructure } from "../lib/detectors";
import type { ExtractedContent } from "../types";

const mock: ExtractedContent = {
  url: "https://trustnodelogic.com/test-page",
  canonicalUrl: "https://trustnodelogic.com/test-page",
  title: "Understanding Hybrid Production Workflows",
  metaDescription: "A comprehensive analysis of hybrid generative workflows and algorithmic sound design strategies for modern audio producers.",
  ogDescription: "A comprehensive analysis of hybrid generative workflows and algorithmic sound design strategies for modern audio producers.",
  twitterDescription: "A comprehensive analysis of hybrid generative workflows and algorithmic sound design strategies for modern audio producers.",
  headings: [
    { level: 1, text: "Understanding Hybrid Production Workflows" },
    { level: 2, text: "Empirical Studies and Citations" },
    { level: 2, text: "Industry Perspectives" },
  ],
  bodyText: 'Understanding Hybrid Production Workflows introduces how digital signal processing and machine learning blend together. "Hybrid production is about finding the soul inside the algorithm," explains the author. According to research from arxiv.org, adding verified citations increases visibility by 35% across engines in 2024. Therefore, sound engineers can build scalable sound design frameworks.',
  wordCount: 55,
  paragraphs: [
    "Understanding Hybrid Production Workflows introduces how digital signal processing and machine learning blend together.",
    '"Hybrid production is about finding the soul inside the algorithm," explains the author.',
    "According to research from arxiv.org, adding verified citations increases visibility by 35% across engines in 2024.",
    "Therefore, sound engineers can build scalable sound design frameworks.",
  ],
  jsonLd: [],
  outboundLinks: [],
};

console.log("=== CHECK STATISTICS ===");
console.log(JSON.stringify(checkStatistics(mock), null, 2));

console.log("=== CHECK STRUCTURE ===");
console.log(JSON.stringify(checkStructure(mock), null, 2));
