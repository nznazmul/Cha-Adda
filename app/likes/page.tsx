"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Sparkles, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchIncomingLikes } from "@/lib/services/matching-service";
import { PublicProfile } from "@/types/database";

export default function LikesPage() {
  const { user } = useAuth();
  const [incomingLikes, setIncomingLikes] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoldMember, setIsGoldMember] = useState(() => {
    if (typeof window !== "undefined") {
      const tier = localStorage.getItem("cha_adda_subscription_tier");
      return tier === "gold" || tier === "platinum";
    }
    return false;
  });

  const hasGoldAccess = isGoldMember || user?.role === "admin";

  const toggleGoldTest = () => {
    const next = !isGoldMember;
    setIsGoldMember(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("cha_adda_subscription_tier", next ? "gold" : "free");
    }
  };

  useEffect(() => {
    async function loadLikes() {
      if (!user) return;
      setLoading(true);
      try {
        const likes = await fetchIncomingLikes(user.id);
        setIncomingLikes(likes);
      } catch (err) {
        console.error("Error loading incoming likes:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLikes();
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold">
              <Heart className="h-3.5 w-3.5 fill-rose-500" />
              <span>{incomingLikes.length} People Liked You</span>
            </div>
            {hasGoldAccess && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-black tracking-wide">
                <Sparkles className="h-3 w-3" />
                <span>GOLD UNLOCKED</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Likes You</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            See who swiped right on your profile before you swipe.
          </p>
        </div>

        {/* Upgrade / Test Action */}
        <div className="flex items-center gap-3">
          {!hasGoldAccess ? (
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:scale-105 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Upgrade to Gold to Reveal</span>
            </Link>
          ) : (
            <button
              onClick={toggleGoldTest}
              type="button"
              className="px-3.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-[11px] font-semibold text-muted-foreground transition-colors"
              title="Toggle preview of locked state"
            >
              <span>Switch View Mode</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          Checking your admirers...
        </div>
      ) : incomingLikes.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-rose-500 mb-3">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">No new likes yet</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Keep your profile active and discoverable. Complete your bio and add high quality photos to get more admirers.
          </p>
          <Link
            href="/discover"
            className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95"
          >
            Explore Profiles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {incomingLikes.map((liker, idx) => {
            const profileUrl = `/profile/${liker.id}`;

            return hasGoldAccess ? (
              /* Unlocked Gold View - Entire Card is Clickable to User Profile */
              <Link
                key={idx}
                href={profileUrl}
                className="group relative aspect-[3/4.2] rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-end"
              >
                {/* Liker Photo */}
                <img
                  src={
                    liker.primary_photo_url ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={liker.display_name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Card Info & View Profile CTA */}
                <div className="relative z-10 p-3.5 text-white">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-black tracking-tight">{liker.display_name}, {liker.age}</p>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5">{liker.city} • {liker.gender}</p>

                  <div className="mt-2.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white text-center text-xs font-bold shadow-md shadow-rose-500/25 group-hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5">
                    <span>View Profile</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ) : (
              /* Locked Tier View - Clicking navigates to Subscription to unlock */
              <Link
                key={idx}
                href="/subscription"
                className="group relative aspect-[3/4.2] rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:border-amber-500/50 transition-all"
                title="Click to upgrade and unlock admirer"
              >
                {/* Blurred Photo */}
                <img
                  src={
                    liker.primary_photo_url ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
                  }
                  alt=""
                  className="w-full h-full object-cover blur-md scale-110 transition-transform group-hover:scale-115"
                />

                {/* Locked Tier Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-white bg-black/45 backdrop-blur-[2px] group-hover:bg-black/55 transition-colors">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/70 border border-amber-400/30 mb-2 shadow-lg group-hover:scale-110 transition-transform">
                    <Lock className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-xs font-bold tracking-tight">{liker.city}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">Liked you recently</p>
                  <span className="mt-2.5 text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Tap to Reveal
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Upgrade Banner Card */}
      {!isGoldMember && incomingLikes.length > 0 && (
        <div className="mt-12 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-black text-foreground">See who likes you instantly</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Upgrade to CHA ADDA Gold to unblur your admirer grid, match with them directly, and get unlimited likes.
            </p>
          </div>
          <Link
            href="/subscription"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:scale-105 transition-all shrink-0"
          >
            Explore Plans
          </Link>
        </div>
      )}
    </div>
  );
}
