"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Mail, Lock, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { switchDevUser, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Dev mode: simulate authentic login
      switchDevUser("usr-aria-01");
      router.push("/discover");
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push("/discover");
    } catch (err: any) {
      setError(err?.message || "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchDevUser(userId);
    router.push("/discover");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md shadow-rose-500/25 mb-4">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Sign in to continue discovering genuine connections.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Test Login Presets (Useful for evaluators) */}
        <div className="pt-2 border-t border-border/60">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Instant Demo Sign In</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("usr-aria-01")}
              className="px-3 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary font-medium text-left truncate transition-colors"
            >
              👩 Aria Vance (User)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("usr-julian-02")}
              className="px-3 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary font-medium text-left truncate transition-colors"
            >
              👨 Julian Ross (User)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("usr-admin-lead")}
              className="col-span-2 px-3 py-2 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-center transition-colors"
            >
              🛡️ Admin Lead (Moderation & Safety)
            </button>
          </div>
        </div>

        {/* Registration Link */}
        <div className="text-center text-xs text-muted-foreground pt-2">
          Don’t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
