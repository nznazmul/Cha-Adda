"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Sparkles, Lock, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchIncomingLikes } from "@/lib/services/matching-service";
import { PublicProfile } from "@/types/database";

export default function LikesPage() {
  const { user } = useAuth();
  const [incomingLikes, setIncomingLikes] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoldMember] = useState(() => {
    if (typeof window !== "undefined") {
      const tier = localStorage.getItem("cha_adda_subscription_tier");
      return tier === "gold" || tier === "platinum";
    }
    return false;
  });

  const hasGoldAccess = isGoldMember || user?.role === "admin";

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold mb-2">
            <Heart className="h-3.5 w-3.5 fill-rose-500" />
            <span>{incomingLikes.length} People Liked You</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Likes You</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            See who swiped right on your profile before you swipe.
          </p>
        </div>

        {/* Upgrade Pill */}
        {!hasGoldAccess && (
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade to Gold to Reveal</span>
          </Link>
        )}
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
            className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold"
          >
            Explore Profiles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {incomingLikes.map((liker, idx) => (
            <div
              key={idx}
              className="relative aspect-[3/4.2] rounded-2xl overflow-hidden border border-border bg-card shadow-sm group"
            >
              {/* Liker Photo with blur conditional on subscription tier */}
              <img
                src={liker.primary_photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"}
                alt=""
                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                  !hasGoldAccess ? "blur-md scale-110" : ""
                }`}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {!hasGoldAccess ? (
                /* Locked Tier Overlay */
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-white bg-black/30 backdrop-blur-[2px]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/20 mb-2">
                    <Lock className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-xs font-bold">{liker.city}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">Liked you recently</p>
                </div>
              ) : (
                /* Unlocked Gold View */
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-sm font-bold">{liker.display_name}, {liker.age}</p>
                  <p className="text-[11px] text-gray-300">{liker.city}</p>
                  <Link
                    href={`/profile/${liker.id}`}
                    className="mt-2 block w-full py-1 text-center rounded-lg bg-primary text-white text-[11px] font-bold"
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          ))}
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
