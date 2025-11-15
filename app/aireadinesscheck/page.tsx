// app/aireadinesscheck/page.tsx
"use client";

import { useEffect, useState } from "react";
import { enablers } from "./seed/enablers";
import Results from "./ui/Results";
import Enabler, { type StageScore } from "./ui/Enabler";
import Header from "./ui/Header";

type TotalsRow = { name: string; sum: number; readiness: number; status: string };

export default function AIReadinessCheckPage() {
  const [page, setPage] = useState(0);

  // one 5-point score per theme; default = 2 (Neutral / Don't know)
  const [scores, setScores] = useState<Record<string, StageScore[]>>(() =>
    Object.fromEntries(
      enablers.map((e) => [e.name, e.themes.map<StageScore>(() => 2)])
    )
  );

  // shared links (read-only mode)
  const [shared, setShared] = useState<null | { totals: TotalsRow[]; avg: number }>(null);

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("results");
    if (!encoded) return;
    try {
      const parsed = JSON.parse(atob(encoded));
      if (parsed?.totals && typeof parsed?.avg === "number") {
        setShared(parsed);
      }
    } catch {
      // ignore malformed query param
    }
  }, []);

  const totalsFromState = (): TotalsRow[] =>
    enablers.map((e) => {
      const themeScores: StageScore[] = scores[e.name] || [];

	// Map stage 0..4 → -2..+2 (centre = neutral)
	const rawSum = themeScores.reduce<number>(
	  (acc, stage) => acc + (stage - 2),
	  0
	);

      // Max absolute value for this enabler (2 points either side per theme)
      const maxAbs = Math.max(1, themeScores.length * 2);

      // Normalize -maxAbs..+maxAbs → 0..100
      const readiness = Math.round(((rawSum + maxAbs) / (2 * maxAbs)) * 100);

      const status =
        readiness < 25 ? "Critical" : readiness < 50 ? "At Risk" : readiness < 75 ? "Established" : "Leading";

      return { name: e.name, sum: rawSum, readiness, status };
    });

  const computeAvg = (totals: TotalsRow[]) =>
    Math.round(totals.reduce((a, t) => a + t.readiness, 0) / Math.max(1, totals.length));

  // Shared / read-only view
  if (shared) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Header />
        <Results
          enablers={enablers}
          getTotals={() => shared.totals}
          getAvg={() => shared.avg}
          mode="shared"
          onRestart={() => (window.location.href = "/aireadinesscheck")}
        />
      </div>
    );
  }

  // Results after finishing all pages
  if (page >= enablers.length) {
    const totals = totalsFromState();
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Header />
        <Results
          enablers={enablers}
          getTotals={() => totals}
          getAvg={() => computeAvg(totals)}
          onRestart={() => setPage(0)}
        />
      </div>
    );
  }

  const enabler = enablers[page];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Header />
      <div className="text-sm text-slate-500">
        Category {page + 1} of {enablers.length} • {enabler.name}
      </div>

      <Enabler
        enabler={enabler}
        values={scores[enabler.name]}
        onChange={(i, value) =>
          setScores((prev) => {
            const current = prev[enabler.name] ?? enabler.themes.map<StageScore>(() => 2);
            const next = current.map((x, idx) => (idx === i ? value : x)) as StageScore[];
            return { ...prev, [enabler.name]: next };
          })
        }
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        isFirst={page === 0}
        isLast={page === enablers.length - 1}
      />
    </div>
  );
}
