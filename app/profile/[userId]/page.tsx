"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  ShieldAlert, 
  Heart, 
  X, 
  Check, 
  Flag
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { devStore } from "@/lib/services/dev-store";
import { blockMember } from "@/lib/services/safety-service";
import { submitSwipe } from "@/lib/services/matching-service";
import { PublicProfile } from "@/types/database";
import { getMemberId } from "@/lib/utils/member-id";
import { BlueTickBadge } from "@/components/ui/blue-tick-badge";

function PublicProfileViewContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params?.userId as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      const rawProfile = devStore.getProfile(userId);
      if (rawProfile) {
        setProfile(devStore.toPublicProfile(rawProfile));
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const handleLike = async () => {
    if (!user || !profile) return;
    await submitSwipe(user.id, profile.id, "like");
    router.push("/discover");
  };

  const handlePass = async () => {
    if (!user || !profile) return;
    await submitSwipe(user.id, profile.id, "pass");
    router.push("/discover");
  };

  const handleBlock = async () => {
    if (!user || !profile) return;
    await blockMember(user.id, profile.id);
    setBlocked(true);
    setTimeout(() => router.push("/discover"), 1500);
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-muted-foreground">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto space-y-4">
        <h2 className="text-lg font-bold">Profile not found</h2>
        <p className="text-xs text-muted-foreground">
          This user profile might be private, inactive, or removed.
        </p>
        <Link href="/discover" className="inline-block px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Link
            href={`/safety/report/${profile.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive transition-colors"
            title="Report this member"
          >
            <Flag className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {blocked && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive font-semibold text-center">
          Member blocked successfully. Redirecting...
        </div>
      )}

      {/* Main Card View */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {/* Photo Carousel Preview */}
        <div className="relative aspect-[3/3.8] bg-secondary">
          <img
            src={profile.primary_photo_url || profile.photos[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black">{profile.display_name}, {profile.age}</h1>
              <BlueTickBadge profile={profile} size="lg" />
              <span className="rounded-full bg-rose-500/90 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide shadow-sm">
                ID: {getMemberId(profile)}
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-0.5">{profile.city} • {profile.gender}</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-5">
          {profile.bio && (
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">About Me</h3>
              <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.dating_intentions?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Dating Intentions</h3>
              <div className="flex flex-wrap gap-2">
                {profile.dating_intentions.map((intent) => (
                  <span key={intent} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                    🎯 {intent}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Safety Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
            <button
              onClick={handleBlock}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive font-medium transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Block Member</span>
            </button>
            <Link
              href={`/safety/report/${profile.id}`}
              className="text-muted-foreground hover:text-destructive font-medium transition-colors"
            >
              Report violation
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={handlePass}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/30 bg-card text-rose-500 shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <X className="h-7 w-7" />
        </button>
        <button
          onClick={handleLike}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-500/40 hover:scale-105 active:scale-95 transition-all"
        >
          <Heart className="h-8 w-8 fill-white" />
        </button>
      </div>
    </div>
  );
}

export default function PublicProfileViewPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-muted-foreground">Loading profile view...</div>}>
      <PublicProfileViewContent />
    </Suspense>
  );
}
