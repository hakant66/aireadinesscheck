// app/aireadinesscheck/ui/Enabler.tsx
"use client";

import ArrowSlider from "./ArrowSlider";
import type { Enabler as EnablerT } from "../seed/enablers";

/**
 * Single 5-point score per theme:
 *  2  = strongly left statement is true
 *  1  = somewhat left statement
 *  0  = neutral / don't know
 * -1  = somewhat right statement
 * -2  = strongly right statement
 */
export type StageScore = -2 | -1 | 0 | 1 | 2;

export default function Enabler({
  enabler,
  values,
  onChange,
  onPrev,
  onNext,
  isFirst,
  isLast,
}: {
  enabler: EnablerT;
  values: StageScore[];
  onChange: (i: number, v: StageScore) => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const allScored = enabler.themes.every((_, i) =>
    Number.isFinite(values?.[i] as number)
  );

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">{enabler.name}</h2>

      {enabler.themes.map((t, i) => {
        const v = (values && values[i] !== undefined ? values[i] : 0) as StageScore;

        return (
          <div key={i} className="mb-6 rounded-2xl border p-4">
            {/* Theme title (e.g. "Purpose & Alignment") */}
            <div className="font-medium">{t.title}</div>

            {/* Two statements under the one title */}
            <div className="mt-2 grid grid-cols-1 items-start gap-3 md:grid-cols-2">
              <p className="min-h-[72px] leading-relaxed text-slate-900/90">
                {t.blue}
              </p>
              <p className="min-h-[72px] leading-relaxed text-slate-900/90 md:text-right">
                {t.orange}
              </p>
            </div>

            {/* Single 5-point arrow slider between the two statements */}
            <div className="mt-3">
              <ArrowSlider
                value={v}
                onChange={(nv) => onChange(i, nv as StageScore)}
                ariaLabel={`${t.title} alignment slider`}
              />
            </div>
          </div>
        );
      })}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="rounded-xl border px-4 py-2 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!allScored}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isLast ? "See Results" : "Next"}
        </button>
      </div>
    </div>
  );
}
