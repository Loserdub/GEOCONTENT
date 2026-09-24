import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Content Gap Checker",
  description: "Analyze pages for Generative Engine Optimization tactics and identify cross-page topical content gaps",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://trustnodelogic.com/geo-content-gap-checker/#software",
      "name": "GEO Content Gap Checker",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": "https://trustnodelogic.com",
      "description":
        "Generative Engine Optimization (GEO) audit engine, scorecard validator, and cross-page topic gap analyzer for modern AI search engines.",
      "author": {
        "@id": "https://trustnodelogic.com/#person",
      },
      "creator": {
        "@id": "https://trustnodelogic.com/#person",
      },
      "publisher": {
        "@id": "https://trustnodelogic.com/#organization",
      },
      "isPartOf": {
        "@id": "https://trustnodelogic.com/#website",
      },
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
        "disarray",
      ],
      "url": "https://trustnodelogic.com",
      "image": "https://trustnodelogic.com/bio-avatar.jpg",
      "email": "mailto:trustnodelogic@gmail.com",
      "jobTitle": [
        "Music Producer",
        "Music Artist",
        "Pioneer of Hybrid AI Music Production",
        "Audio Engineer",
        "Creative Technologist",
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
        "https://github.com/loserdub",
      ],
      "memberOf": [
        {
          "@id": "https://trustnodelogic.com/#organization",
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://trustnodelogic.com/#organization",
      "name": "Trust Node Logic",
      "alternateName": "JRAY & Trust Node Logic",
      "url": "https://trustnodelogic.com",
      "logo": "https://trustnodelogic.com/favicon.png",
      "founder": {
        "@id": "https://trustnodelogic.com/#person",
      },
      "slogan": "The Frontier of Hybrid AI Music Production & Creative Technology",
      "knowsAbout": [
        "Hybrid Production",
        "Generative Engine Optimization",
        "AI Music Generation",
        "Audio Engineering",
        "Generative Audio Workflows",
        "HPS-1.0 Metadata Verification",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://trustnodelogic.com/#website",
      "url": "https://trustnodelogic.com",
      "name": "Trust Node Logic | Pioneer of Hybrid AI Music Production",
      "author": {
        "@id": "https://trustnodelogic.com/#person",
      },
      "publisher": {
        "@id": "https://trustnodelogic.com/#organization",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-surface text-text-body antialiased">
        {/* Visually-hidden Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-accent focus:text-white focus:shadow-2xl focus:ring-2 focus:ring-white focus:outline-none text-xs font-bold uppercase tracking-wider transition-all"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
