// app/aireadinesscheck/ui/Results.tsx
"use client";

import { useState } from "react";

type TotalsRow = {
  name: string;
  sum: number;
  readiness: number;
  status: string;
};

type ResultsProps = {
  enablers: { name: string; description?: string }[];
  getTotals: () => TotalsRow[];
  getAvg: () => number;
  onRestart: () => void;
  mode?: "shared";
};

function readinessColor(readiness: number): string {
  if (readiness < 25) return "bg-rose-500";
  if (readiness < 50) return "bg-amber-500";
  if (readiness < 75) return "bg-sky-500";
  return "bg-emerald-500";
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case "Critical":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
    case "At Risk":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "Established":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
    case "Leading":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
  }
}

export default function Results({
  enablers,
  getTotals,
  getAvg,
  onRestart,
  mode,
}: ResultsProps) {
  const totals = getTotals();
  const avg = getAvg();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (typeof window === "undefined") return;

      const payload = { totals, avg };
      const encoded = btoa(JSON.stringify(payload));
      const url = `${window.location.origin}/aireadinesscheck?results=${encodeURIComponent(
        encoded
      )}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">
            AI Readiness Summary
          </h1>
          <p className="max-w-xl text-sm text-slate-600">
            This overview shows how your organisation scores across key AI
            readiness categories, based on your responses to each slider.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {mode === "shared" && (
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Shared view
            </div>
          )}

          <div className="flex items-center gap-4">
            {mode !== "shared" && (
              <button
                type="button"
                onClick={handleShare}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? "Link copied" : "Copy shareable link"}
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              Start again
            </button>
          </div>
        </div>
      </div>

      {/* Overall average */}
      <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-6 py-5 text-slate-50">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-300">
            Overall readiness
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold">{avg}%</div>
          </div>
          <p className="mt-1 max-w-md text-xs text-slate-300">
            0–24% Critical • 25–49% At Risk • 50–74% Established • 75–100%
            Leading.
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {totals.map((row) => {
          const enablerMeta = enablers.find((e) => e.name === row.name);
          const color = readinessColor(row.readiness);
          const badgeColor = statusBadgeColor(row.status);

          return (
            <div
              key={row.name}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {row.name}
                  </h2>
                  {enablerMeta?.description && (
                    <p className="mt-1 text-xs text-slate-600">
                      {enablerMeta.description}
                    </p>
                  )}
                </div>
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ${badgeColor}`}
                >
                  {row.status}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Readiness score</span>
                <span className="font-medium text-slate-800">
                  {row.readiness}%
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${row.readiness}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
