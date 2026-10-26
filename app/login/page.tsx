"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flame, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { useAuth } from "@/components/providers/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
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

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const activeProfile = await refreshAuth();
      router.refresh();

      if (activeProfile?.account_status === "banned") {
        await supabase.auth.signOut();
        setError("This account has been permanently banned due to safety violations.");
        setLoading(false);
        return;
      }

      if (activeProfile?.account_status === "suspended") {
        await supabase.auth.signOut();
        setError("This account is temporarily suspended by platform moderators.");
        setLoading(false);
        return;
      }

      if (activeProfile?.role === "admin" || activeProfile?.role === "moderator") {
        router.push("/admin");
      } else if (activeProfile && !activeProfile.profile_complete) {
        router.push("/onboarding");
      } else {
        router.push("/discover");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/10 to-amber-500/10 border border-rose-500/20 p-2 shadow-lg shadow-rose-500/10 mb-4 overflow-hidden">
            <Image
              src="/logo-icon.png"
              alt="CHA ADDA Logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
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

        {/* Test Admin Quick Fill Helper */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> টেস্ট অ্যাডমিন অ্যাকাউন্ট
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@chaadda.com");
                setPassword("Admin@123456");
                setError(null);
              }}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-xs"
            >
              Auto-Fill
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5">
            <div><strong className="text-foreground">Email:</strong> admin@chaadda.com</div>
            <div><strong className="text-foreground">Password:</strong> Admin@123456</div>
          </div>
        </div>

        {/* Registration Link */}
        <div className="text-center text-xs text-muted-foreground pt-1">
          Don’t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
