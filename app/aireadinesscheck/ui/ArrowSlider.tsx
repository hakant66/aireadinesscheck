// app/aireadinesscheck/ui/ArrowSlider.tsx
"use client";

const STOPS = [2, 1, 0, -1, -2] as const;
const LABELS = [
  "Always true",
  "Sometimes true",
  "Neutral",
  "Sometimes true",
  "Always true",
];

export default function ArrowSlider({
  // kept for backwards compatibility; not used anymore
  side,
  value,
  onChange,
  ariaLabel,
}: {
  side?: "blue" | "orange";
  value: number; // one of 2, 1, 0, -1, -2
  onChange: (v: number) => void;
  ariaLabel?: string;
}) {
  // map current value to index 0..4, default to Neutral (index 2)
  const idx = STOPS.indexOf(value as (typeof STOPS)[number]);
  const currentIndex = idx === -1 ? 2 : idx;

  return (
    <div className="w-full">
      {/* labels */}
      <div className="grid grid-cols-5 text-[11px] text-slate-500">
        {LABELS.map((lab, i) => (
          <div
            key={lab + i}
            className={`px-1 text-center ${
              i === currentIndex ? "text-emerald-700 font-semibold" : ""
            }`}
          >
            {lab}
          </div>
        ))}
      </div>

      {/* track + arrow thumb
          Track is 80% wide starting at 10%, so it runs from the
          centre of the first "Always true" to the centre of the last. */}
      <div className="relative mt-2 h-8">
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={currentIndex}
          onChange={(e) =>
            onChange(STOPS[parseInt(e.target.value, 10)] as number)
          }
          aria-label={ariaLabel}
          className="arrowRange absolute left-[10%] w-[80%] top-1/2 -translate-y-1/2"
        />
      </div>

      <style jsx>{`
        .arrowRange {
          -webkit-appearance: none;
          appearance: none;
          /* NOTE: no width here – Tailwind w-[80%] controls it */
          height: 6px;
          background: rgba(148, 163, 184, 0.35); /* track */
          border-radius: 9999px;
          outline: none;
        }

        .arrowRange:focus {
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25); /* emerald focus */
        }

        /* WEBKIT thumb → upward triangle in dark green */
        .arrowRange::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 18px solid #047857; /* emerald-800-ish */
          margin-top: -12px;
          cursor: pointer;
        }

        /* FIREFOX track */
        .arrowRange::-moz-range-track {
          height: 6px;
          background: rgba(148, 163, 184, 0.35);
          border-radius: 9999px;
        }

        /* FIREFOX thumb → triangle via clip-path */
        .arrowRange::-moz-range-thumb {
          width: 22px;
          height: 18px;
          background: #047857;
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
