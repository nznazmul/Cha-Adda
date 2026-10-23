import React from "react";
import Link from "next/link";
import { HeartHandshake, ShieldAlert, Check, XCircle } from "lucide-react";

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
          <HeartHandshake className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Community Standards</h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          CHA ADDA is built for respectful, consenting adults. Our guidelines outline what is expected and what is strictly prohibited.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Do's */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <Check className="h-5 w-5" />
            <span>What We Encourage</span>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-foreground/80">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-400">✓</span>
              <span><strong>Authentic Profiles:</strong> Use your real name, current photographs of yourself, and accurate age.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-400">✓</span>
              <span><strong>Honest Intentions:</strong> State clearly whether you seek a long-term partner, friendship, or casual dating.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-400">✓</span>
              <span><strong>Mutual Respect:</strong> Respect boundaries and decisions when someone passes or unmatches.</span>
            </li>
          </ul>
        </div>

        {/* Don'ts */}
        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
            <XCircle className="h-5 w-5" />
            <span>Strictly Prohibited</span>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-foreground/80">
            <li className="flex items-start gap-2">
              <span className="font-bold text-rose-400">✕</span>
              <span><strong>Underage Use:</strong> Accounts belonging to minors under 18 are terminated immediately.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-rose-400">✕</span>
              <span><strong>Harassment & Hate Speech:</strong> Bullying, intimidation, derogatory slurs, or persistent unwanted messages.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-rose-400">✕</span>
              <span><strong>Explicit / Nude Imagery:</strong> Public profile photos must adhere to non-explicit standards.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-rose-400">✕</span>
              <span><strong>Spam & Scams:</strong> Commercial solicitation, selling adult services, or financial scams lead to permanent bans.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
