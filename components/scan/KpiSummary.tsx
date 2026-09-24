import React from "react";
import { FileText, TrendingUp, Layers, ShieldCheck } from "lucide-react";

export interface KpiSummaryProps {
  totalScanned: number;
  successfulScans: number;
  totalGapsCount: number;
  recurringTopicsCount: number;
  avgPassRate: number;
}

const KPI_ITEMS = [
  {
    key: "pages" as const,
    label: "Pages Scanned",
    Icon: FileText,
    iconClass: "text-text-muted",
    valueClass: "text-text-heading",
  },
  {
    key: "gaps" as const,
    label: "Content Gaps",
    Icon: TrendingUp,
    iconClass: "text-accent-text",
    valueClass: "text-accent-text",
  },
  {
    key: "topics" as const,
    label: "Recurring Topics",
    Icon: Layers,
    iconClass: "text-secondary-text",
    valueClass: "text-secondary-text",
  },
  {
    key: "passRate" as const,
    label: "GEO Tactics Pass Rate",
    Icon: ShieldCheck,
    iconClass: "text-success-text",
    valueClass: "text-success-text",
  },
];

export function KpiSummary({
  totalScanned,
  successfulScans,
  totalGapsCount,
  recurringTopicsCount,
  avgPassRate,
}: KpiSummaryProps) {
  const values: Record<string, React.ReactNode> = {
    pages: (
      <>
        {successfulScans}{" "}
        <span className="text-sm text-text-faint font-normal">/ {totalScanned}</span>
      </>
    ),
    gaps: totalGapsCount,
    topics: recurringTopicsCount,
    passRate: `${avgPassRate}%`,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" role="region" aria-label="Scan summary">
      {KPI_ITEMS.map(({ key, label, Icon, iconClass, valueClass }) => (
        <div
          key={key}
          className="bg-surface-card border border-border-subtle rounded-xl p-4 space-y-2"
        >
          <div className={`flex items-center gap-1.5 text-xs font-medium text-text-muted`}>
            <Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden="true" />
            <span>{label}</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${valueClass}`}>
            {values[key]}
          </div>
        </div>
      ))}
    </div>
  );
}
