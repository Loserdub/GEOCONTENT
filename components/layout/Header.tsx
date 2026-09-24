import React from "react";
import Link from "next/link";
import { Target, KeyRound } from "lucide-react";

export interface HeaderProps {
  apiKey?: string;
  onToggleApiKey?: () => void;
}

export function Header({ apiKey = "", onToggleApiKey }: HeaderProps) {
  const hasKey = apiKey.trim().length > 0;

  return (
    <header className="border-b border-border-subtle bg-surface/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-accent rounded-lg" aria-label="GEO Content Gap Checker home">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-md shadow-accent/20 group-hover:shadow-accent/30 transition-shadow">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-text-heading">
              GEO Content Gap Checker
            </span>
            <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded bg-accent-muted text-accent-text border border-accent/20">
              v1.0 MVP
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          {onToggleApiKey && (
            <button
              type="button"
              onClick={onToggleApiKey}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                hasKey
                  ? "bg-success-muted text-success-text border-success/30 hover:bg-success-muted/80"
                  : "bg-surface-card text-text-muted border-border-subtle hover:text-text-heading hover:border-border-strong"
              }`}
              aria-label={hasKey ? "Gemini API key is active. Click to manage." : "Click to enter Gemini API key."}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium hidden sm:inline">
                {hasKey ? "Gemini Key Active" : "Set Gemini Key"}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  hasKey ? "bg-success animate-pulse" : "bg-warning"
                }`}
                aria-hidden="true"
              />
            </button>
          )}

          {!onToggleApiKey && (
            <div className="flex items-center gap-2 text-text-muted" aria-label="Engine status">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="hidden sm:inline">Gemini Engine Ready</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
