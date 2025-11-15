// app/aireadinesscheck/ui/Results.tsx
"use client";

import { useState } from "react";
import jsPDF from "jspdf";

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

// Textual status for summary blocks
const statusText = (v: number) =>
  v < 25 ? "Critical" :
  v < 50 ? "At Risk" :
  v < 75 ? "Established" :
  "Leading";

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

  // Generate and download the PDF using jsPDF
  const handleDownload = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    // Header bar
    pdf.setFillColor(0, 86, 255);
    pdf.rect(0, 0, W, 22, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("LeadAI — AI Readiness Report", 10, 14);

    // Summary block
    const overallColor =
      avg < 25 ? [232, 30, 30] :
      avg < 50 ? [255, 192, 0] :
      avg < 75 ? [0, 176, 80] :
      [0, 86, 255];
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text("Overall AI Readiness", 10, 32);
    pdf.setTextColor(...(overallColor as [number, number, number]));
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text(`${avg}% (${statusText(avg)})`, 10, 42);

    // Table headers
    let y = 54;
    const colX = { enabler: 10, total: 120, readiness: 150, status: 175 };
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Enabler", colX.enabler, y);
    pdf.text("Total", colX.total, y);
    pdf.text("Readiness %", colX.readiness, y);
    pdf.text("Status", colX.status, y);
    pdf.setLineWidth(0.3);
    pdf.line(10, y + 2, W - 10, y + 2);
    y += 8;

    // Populate table rows with pagination
    pdf.setFont("helvetica", "normal");
    const lineHeight = 7;
    const bottom = H - 18;
    totals.forEach((t) => {
      if (y > bottom) {
        pdf.addPage();
        y = 20;
      }
      const maxWidth = colX.total - colX.enabler - 2;
      const lines = pdf.splitTextToSize(t.name, maxWidth);
      lines.forEach((ln, i) => {
        if (i === 0) {
          pdf.text(String(ln), colX.enabler, y);
          pdf.text(String(t.sum), colX.total, y, { align: "left" });
          pdf.text(`${t.readiness}%`, colX.readiness, y, { align: "left" });
          const rc =
            t.readiness < 25 ? [232, 30, 30] :
            t.readiness < 50 ? [255, 192, 0] :
            t.readiness < 75 ? [0, 176, 80] :
            [0, 86, 255];
          pdf.setTextColor(...(rc as [number, number, number]));
          pdf.text(t.status, colX.status, y, { align: "left" });
          pdf.setTextColor(0, 0, 0);
        } else {
          pdf.text(String(ln), colX.enabler, y);
        }
        y += lineHeight;
      });
    });

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text("© LeadAI™ | ISO 42001 & EU AI Act aligned readiness diagnostic", 10, H - 8);

    pdf.save("LeadAI_Readiness_Report.pdf");
  };

  const handleShare = async () => {
    try {
      if (typeof window === "undefined") return;

      const payload = { totals, avg };
      const encoded = btoa(JSON.stringify(payload));
      const url = `${window.location.origin}/aireadinesscheck?results=${encodeURIComponent(encoded)}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore copy errors silently
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
            This overview shows how your organisation scores across key AI readiness categories,
            based on your responses to each slider.
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
              <>
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copied ? "Link copied" : "Copy shareable link"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
                >
                  Download PDF
                </button>
              </>
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
            0–24% Critical • 25–49% At Risk • 50–74% Established • 75–100% Leading.
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
