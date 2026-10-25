"use client";

import React from "react";
import Link from "next/link";
import { 
  Flame, 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  CheckCircle, 
  ArrowRight,
  Coffee,
  Compass,
  Lock,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";

export default function LandingPage() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        window.location.href = `/auth/callback?code=${code}&next=/reset-password`;
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-rose-600/20 via-pink-600/10 to-amber-500/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="mx-auto max-w-5xl text-center relative z-10 flex flex-col items-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-400 mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Modern 18+ Matchmaking Experience</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl">
            Spark Real Connections <br />
            <span className="gradient-text-primary">Over Authentic Dates.</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Discover verified people nearby who share your dating intentions, passions, and vibe. Swipe, match, and chat in real-time — safe, simple, and respectful.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href={user ? "/discover" : "/register"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Flame className="h-5 w-5" />
              <span>{user ? "Continue Swiping" : "Create Free Profile"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/safety"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card/80 px-6 py-4 text-base font-semibold text-foreground hover:bg-secondary transition-all"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>Safety Standards</span>
            </Link>
          </div>

          {/* Interactive Card Mockup Preview */}
          <div className="mt-14 relative w-full max-w-sm sm:max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/10 glass-panel group">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
              alt="Aria Vance dating profile"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Profile Card Overlay Info */}
            <div className="absolute bottom-6 left-6 right-6 text-left text-white">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">Aria Vance, 26</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-xs text-rose-200 font-medium mt-0.5">Architect • Dhaka, Bangladesh</p>
              <p className="text-xs text-gray-200 mt-2 line-clamp-2">
                Architect by day, rooftop barista and vinyl collector by night. Let’s find the best chai in town.
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold">
                  ☕ Coffee & Chai
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold">
                  🎵 Vinyl
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold">
                  🏛️ Architecture
                </span>
              </div>

              {/* Action Buttons Mockup */}
              <div className="flex items-center justify-center gap-6 mt-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/80 text-rose-500 border border-white/20 shadow-lg">
                  <span className="text-lg font-bold">✕</span>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-500/40">
                  <Heart className="h-7 w-7 fill-white" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/80 text-amber-400 border border-white/20 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="w-full py-16 sm:py-24 border-t border-border/40 bg-secondary/20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Designed For Real People</h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              A dating platform built on trust, genuine intention, and safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col p-8 rounded-3xl border border-border/60 bg-card shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-6">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Atomic Mutual Matching</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No awkward unsolicited messages. You only connect when both of you swipe right. Powered by atomic database guarantees that prevent fake matches.
              </p>
            </div>

            <div className="flex flex-col p-8 rounded-3xl border border-border/60 bg-card shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Adults Only & Safe</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Strict 18+ verification enforced server-side. Precise GPS coordinates are never exposed, and reporting and instant blocking are built into every screen.
              </p>
            </div>

            <div className="flex flex-col p-8 rounded-3xl border border-border/60 bg-card shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 mb-6">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Messaging</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect instantly with seamless Supabase Realtime synchronization. Private conversations protected by PostgreSQL Row Level Security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dating Intentions Section */}
      <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Be upfront with what you’re looking for.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-sm sm:text-base">
            No guessing games. Filter potential matches by their dating intentions and lifestyle preferences.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              "Long-term relationship",
              "Serious dating",
              "Casual dating",
              "Friendship & Networking",
              "Still figuring it out",
            ].map((intention, idx) => (
              <span
                key={idx}
                className="px-5 py-2.5 rounded-full border border-border/80 bg-card text-sm font-semibold shadow-sm hover:border-primary hover:text-primary transition-all cursor-default"
              >
                {intention}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Final CTA */}
      <section className="w-full py-20 border-t border-border/40 bg-gradient-to-b from-card to-background px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 mx-auto mb-6 shadow-lg shadow-rose-500/30">
            <Heart className="h-8 w-8 text-white fill-white" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Ready to find your person?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-8">
            Join thousands of adults discovering genuine matches on CHA ADDA today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Get Started — It's Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
