import React from "react";

export interface StatusPillProps {
  variant?: "emerald" | "rose" | "amber" | "cyan" | "indigo" | "slate";
  passed?: boolean;
  passLabel?: string;
  failLabel?: string;
  label?: string;
  className?: string;
}

const variantStyles: Record<NonNullable<StatusPillProps["variant"]>, string> = {
  emerald: "bg-success-muted text-success-text border border-success/30",
  rose:    "bg-danger-muted  text-danger-text  border border-danger/30",
  amber:   "bg-warning-muted text-warning-text border border-warning/30",
  cyan:    "bg-accent-muted  text-accent-text  border border-accent/20",
  indigo:  "bg-accent-muted  text-accent-text  border border-accent/20",
  slate:   "bg-surface-card  text-text-muted   border border-border-subtle",
};

export function StatusPill({
  variant,
  passed,
  passLabel = "PASS",
  failLabel = "FAIL",
  label,
  className = "",
}: StatusPillProps) {
  let resolvedVariant: NonNullable<StatusPillProps["variant"]>;
  let resolvedLabel: string;

  if (typeof passed === "boolean") {
    resolvedVariant = variant || (passed ? "emerald" : "rose");
    resolvedLabel = label || (passed ? passLabel : failLabel);
  } else {
    resolvedVariant = variant || "slate";
    resolvedLabel = label || "FYI";
  }

  const style = variantStyles[resolvedVariant];

  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${style} ${className}`}
    >
      {resolvedLabel}
    </span>
  );
}
