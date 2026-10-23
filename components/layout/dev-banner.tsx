"use client";

import React, { useState } from "react";
import { Info, Database, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";

export function DevBanner() {
  const { isSupabaseConfigured } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (isSupabaseConfigured) {
    return (
      <aside aria-label="Supabase Status" className="w-full bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-300 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Connected to live Supabase database with active Row Level Security (RLS).</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-emerald-400/60 hover:text-emerald-400 ml-2"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Environment Configuration Notice" className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs px-4 py-2">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-300">Local Dev State Active:</strong>{" "}
            Supabase credentials are not configured in <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300 font-mono">.env.local</code>. Running in-memory database engine with full swipe, match, and chat persistence for demo testing.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0"
          >
            <span>Supabase Docs</span>
            <ChevronRight className="h-3 w-3" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400/60 hover:text-amber-300"
            aria-label="Dismiss notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
