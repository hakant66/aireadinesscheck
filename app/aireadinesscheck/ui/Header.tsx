// app/aireadinesscheck/ui/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-600 to-blue-500 p-4 sm:p-6 text-white shadow-lg">
      <div className="flex items-center justify-between gap-3">
        {/* Logo + title → clickable, goes to LeadAI site */}
        <Link
          href="https://www.theleadai.co.uk/"
          className="flex items-center gap-3"
          aria-label="Go to LeadAI website"
        >
          <Image
            src="/LeadAI.webp"
            alt="LeadAI"
            width={36}
            height={36}
            className="rounded-lg ring-1 ring-white/40"
          />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/80">
              LEADAI · TRUST SCORECARD
            </div>
            <div className="text-xl sm:text-2xl font-semibold">
              AI Readiness Check
            </div>
          </div>
        </Link>

        {/* Return Home button → same URL */}
        <Link
          href="https://www.theleadai.co.uk/"
          className="rounded-xl bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-white"
          title="Return to LeadAI website"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
