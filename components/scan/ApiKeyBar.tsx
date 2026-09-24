"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ApiKeyBarProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export function ApiKeyBar({
  apiKey,
  onApiKeyChange,
  isOpen: controlledIsOpen,
  onToggleOpen,
}: ApiKeyBarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(apiKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleExpanded = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  // Sync inputValue if apiKey prop changes from outside
  useEffect(() => {
    setInputValue(apiKey);
  }, [apiKey]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    onApiKeyChange(trimmed);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleClear = () => {
    setInputValue("");
    onApiKeyChange("");
    setJustSaved(false);
  };

  const hasKey = apiKey.trim().length > 0;

  return (
    <section
      className="rounded-2xl border border-border-subtle bg-surface-raised/90 backdrop-blur-sm p-4 sm:p-5 shadow-lg shadow-black/20 transition-all"
      aria-labelledby="api-key-bar-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent-muted flex items-center justify-center text-accent-text border border-accent/20">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="api-key-bar-heading"
                className="text-sm font-semibold text-text-heading"
              >
                Gemini API Key
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-surface-card border border-border-subtle text-text-muted">
                BYOK
              </span>
            </div>
            <p className="text-xs text-text-muted">
              {hasKey
                ? "Custom Gemini API key active for 2-pass AI gap scoring & justifications."
                : "Add a free Google Gemini key to enable AI gap priority scoring & prose justifications."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Key Status Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              hasKey
                ? "bg-success-muted text-success-text border-success/30"
                : "bg-surface-card text-text-muted border-border-subtle"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                hasKey ? "bg-success animate-pulse" : "bg-text-faint"
              }`}
            />
            <span>{hasKey ? "Key Configured" : "No Key Set (Optional)"}</span>
          </div>

          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-surface-card hover:bg-border-subtle text-text-muted hover:text-text-heading border border-border-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-colors"
            aria-expanded={isExpanded}
            aria-controls="api-key-form-container"
            aria-label={isExpanded ? "Collapse API key settings" : "Expand API key settings"}
          >
            <span>{isExpanded ? "Close" : hasKey ? "Change Key" : "Enter Key"}</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Key Configuration Bar */}
      {isExpanded && (
        <div
          id="api-key-form-container"
          className="mt-4 pt-4 border-t border-border-subtle space-y-3 animate-slide-in"
        >
          <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="gemini-api-key-input" className="sr-only">
                Google Gemini API Key
              </label>
              <input
                id="gemini-api-key-input"
                type={showKey ? "text" : "password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="AIzaSy... (paste your Gemini API key)"
                className="w-full rounded-xl border border-border-subtle bg-surface-overlay px-3.5 py-2.5 pr-10 text-xs font-mono text-text-heading placeholder:text-text-faint focus:border-border-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-heading focus-visible:ring-2 focus-visible:ring-accent rounded p-1 transition-colors"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition active:scale-[0.98]"
              >
                {justSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Key</span>
                )}
              </button>

              {hasKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-surface-card hover:bg-danger-muted hover:text-danger-text text-text-muted border border-border-subtle text-xs font-medium focus-visible:ring-2 focus-visible:ring-danger focus-visible:outline-none transition"
                  title="Remove saved API key from this browser"
                  aria-label="Remove saved API key"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success-text shrink-0" aria-hidden="true" />
              <span>
                Key is stored only in your browser (<code className="font-mono bg-surface-card px-1 py-0.5 rounded text-text-body">localStorage</code>) and never logged on servers.
              </span>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent-text hover:underline focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              <span>Get a free Gemini API key</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
