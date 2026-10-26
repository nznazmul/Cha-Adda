"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Heart, Sparkles, ArrowRight, UserCheck, Eye, ShieldCheck, MapPin } from "lucide-react";
import { fetchIncomingLikes, submitSwipe, ensureUserMatch } from "@/lib/services/matching-service";
import { PublicProfile } from "@/types/database";
import { BlueTickBadge } from "@/components/ui/blue-tick-badge";
import { devStore } from "@/lib/services/dev-store";

export default function LikesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [incomingLikes, setIncomingLikes] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLikes() {
      const activeUserId = user?.id || devStore.getCurrentUserId();
      if (!activeUserId) return;
      setLoading(true);
      try {
        const likes = await fetchIncomingLikes(activeUserId);
        setIncomingLikes(likes);
      } catch (err) {
        console.error("Error loading incoming likes:", err);
        // Fallback to devStore
        const fallback = devStore.getIncomingLikes(activeUserId);
        setIncomingLikes(fallback);
      } finally {
        setLoading(false);
      }
    }

    loadLikes();
  }, [user]);

  const handleInstantMatch = async (e: React.MouseEvent, liker: PublicProfile) => {
    e.preventDefault();
    e.stopPropagation();
    const currentId = user?.id || devStore.getCurrentUserId();
    if (!currentId || matchingId) return;

    setMatchingId(liker.id);
    try {
      const matchRes = await ensureUserMatch(liker.id);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#e11d48", "#f59e0b", "#10b981", "#6366f1"],
        });
      } catch {
        // Confetti fallback
      }

      setTimeout(() => {
        router.push(`/chat/${matchRes.matchId}?matched=true`);
      }, 900);
    } catch (err) {
      console.error("Error in instant match from likes:", err);
      const matchRes = await ensureUserMatch(liker.id);
      setTimeout(() => {
        router.push(`/chat/${matchRes.matchId}?matched=true`);
      }, 800);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20">
              <Heart className="h-3.5 w-3.5 fill-rose-500" />
              <span>{incomingLikes.length} People Liked You</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold">
              <Sparkles className="h-3 w-3" />
              <span>ভিউ ও অ্যাড সক্রিয়</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Likes You (আপনাকে যারা পছন্দ করেছেন)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            সরাসরি প্রোফাইল দেখুন এবং পছন্দ হলে সাথে সাথে অ্যাড করে চ্যাট শুরু করুন।
          </p>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-bold transition-all border border-border self-start sm:self-auto"
        >
          <span>ডিসকভার কার্ড দেখুন</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground">আপনার প্রশংসকদের তালিকা লোড হচ্ছে...</p>
        </div>
      ) : incomingLikes.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-rose-500 mb-3 shadow-inner">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">এখনও নতুন কোনো লাইক আসেনি</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6 leading-relaxed">
            আপনার প্রোফাইল সম্পূর্ণ রাখুন ও সুন্দর ছবি যোগ করুন যাতে আরও বেশি মানুষ আপনাকে পছন্দ করতে পারেন।
          </p>
          <Link
            href="/discover"
            className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95"
          >
            Explore Profiles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {incomingLikes.map((liker, idx) => {
            const profileUrl = `/profile/${liker.id}?from=likes`;
            const isBeingMatched = matchingId === liker.id;

            return (
              <div
                key={liker.id || idx}
                className="group relative aspect-[3/4.5] rounded-3xl overflow-hidden border border-border/80 bg-card shadow-md hover:shadow-2xl hover:border-rose-500/50 transition-all duration-300 flex flex-col justify-end"
              >
                {/* Liker Photo */}
                <img
                  src={
                    liker.primary_photo_url ||
                    liker.photos?.[0]?.url ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={liker.display_name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                {/* Top Badge: Liked You */}
                <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow-lg shadow-rose-600/30">
                  <Heart className="h-3.5 w-3.5 fill-white" />
                  <span>Liked You</span>
                </div>

                {/* Card Info & Action CTAs */}
                <div className="relative z-10 p-4 text-white space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={profileUrl}
                        className="text-base font-black tracking-tight hover:underline flex items-center gap-1.5"
                      >
                        <span>{liker.display_name}, {liker.age}</span>
                      </Link>
                      <BlueTickBadge profile={liker} size="sm" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-300 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0 text-rose-400" />
                      <span>{liker.city} • {liker.gender}</span>
                    </div>
                    {liker.bio && (
                      <p className="text-[11px] text-gray-300 line-clamp-1 mt-1 opacity-90">
                        {liker.bio}
                      </p>
                    )}
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* 1. View Profile Button */}
                    <Link
                      href={profileUrl}
                      className="py-2 px-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-white/20"
                      title="View full profile"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Profile</span>
                    </Link>

                    {/* 2. Add / Instant Match Button */}
                    <button
                      type="button"
                      onClick={(e) => handleInstantMatch(e, liker)}
                      disabled={isBeingMatched}
                      className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-60"
                      title="Add & match immediately"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{isBeingMatched ? "অ্যাড হচ্ছে..." : "অ্যাড করুন"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Tip */}
      <div className="mt-12 rounded-3xl border border-border/80 bg-secondary/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>নিরাপদ ও বিশ্বস্ত আড্ডা</span>
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            যেকোনো সদস্যের প্রোফাইল ওপেন করে তাদের বিস্তারিত জানতে পারবেন এবং পছন্দ হলে &ldquo;অ্যাড করুন&rdquo; বাটনে ক্লিক করে সাথে সাথে ম্যাচ তৈরি করে চ্যাট শুরু করতে পারবেন।
          </p>
        </div>
        <Link
          href="/subscription"
          className="px-5 py-2 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold shrink-0 transition-colors"
        >
          সাবস্ক্রিপশন প্ল্যানসমূহ
        </Link>
      </div>
    </div>
  );
}
