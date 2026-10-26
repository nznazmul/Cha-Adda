"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Heart, 
  X, 
  Flag,
  Edit3,
  Check,
  Sparkles,
  UserCheck,
  MapPin,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { devStore } from "@/lib/services/dev-store";
import { submitSwipe, fetchPublicProfile, fetchIncomingLikes, ensureUserMatch } from "@/lib/services/matching-service";
import { PublicProfile, Profile } from "@/types/database";
import { getMemberId } from "@/lib/utils/member-id";
import { calculateAge } from "@/lib/utils";
import { BlueTickBadge } from "@/components/ui/blue-tick-badge";

function getCachedAuthUser(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cha_adda_auth_user");
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

function PublicProfileViewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const rawUserId = params?.userId as string;
  const userId = rawUserId ? decodeURIComponent(rawUserId).trim() : "";

  const isFromLikesParam = searchParams.get("from") === "likes" || searchParams.get("admirer") === "true";

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [isAdmirer, setIsAdmirer] = useState(isFromLikesParam);
  const [matchSuccess, setMatchSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Synchronous effective user
  const effectiveUser = user || getCachedAuthUser();

  const isSelf = Boolean(
    userId === "me" ||
    userId === "preview" ||
    userId === "self" ||
    (effectiveUser && (
      effectiveUser.id === userId ||
      effectiveUser.unique_id === userId ||
      getMemberId(effectiveUser).toLowerCase() === userId.toLowerCase()
    ))
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) return;
      setLoading(true);

      // 1. If self viewing (Preview Card from /profile)
      if (isSelf && effectiveUser) {
        const calculatedAge = calculateAge(effectiveUser.date_of_birth || "2000-01-01");
        const age = Math.max(18, isNaN(calculatedAge) ? 18 : calculatedAge);
        const myPhotos = devStore.getPhotos(effectiveUser.id);
        const primary = myPhotos.find((ph) => ph.is_primary) || myPhotos[0];
        const defaultPhoto = effectiveUser.gender === "woman"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80";

        if (isMounted) {
          setProfile({
            id: effectiveUser.id,
            unique_id: getMemberId(effectiveUser),
            display_name: effectiveUser.display_name,
            age,
            gender: effectiveUser.gender,
            orientation: effectiveUser.orientation,
            bio: effectiveUser.bio,
            city: effectiveUser.city,
            job_title: effectiveUser.job_title,
            education: effectiveUser.education,
            height_cm: effectiveUser.height_cm,
            dating_intentions: effectiveUser.dating_intentions || [],
            interests: effectiveUser.interests || [],
            languages: effectiveUser.languages || [],
            prompts: effectiveUser.prompts || [
              { id: "pr-1", question: "আমার পারফেক্ট শুক্রবারের আড্ডা...", answer: "এক কাপ কড়া দুধ চা আর চমৎকার কোনো জায়গায় প্রিয় মানুষের সাথে নির্ভেজাল গল্প।" },
              { id: "pr-2", question: "যে বিষয়ে আমার সাথে ঘণ্টার পর ঘণ্টা তর্ক করা যাবে...", answer: "চা নাকি কফি, আর প্রিয় ভ্রমণ স্মৃতি নিয়ে!" },
              { id: "pr-3", question: "আমার প্রিয় মিষ্টি বা স্ন্যাক্স...", answer: "চায়ের সাথে মুচমুচে গরম সিঙ্গাড়া অথবা বাকরখানি।" },
            ],
            verified: effectiveUser.verified,
            verified_until: effectiveUser.verified_until,
            photos: myPhotos.length > 0 ? myPhotos : [{
              id: "photo-self",
              user_id: effectiveUser.id,
              storage_path: "",
              url: defaultPhoto,
              display_order: 0,
              is_primary: true,
              moderation_status: "approved",
              created_at: new Date().toISOString()
            }],
            primary_photo_url: primary?.url || defaultPhoto,
          });
          setLoading(false);
        }
        return;
      }

      // If auth is still initializing and we don't have effectiveUser yet, wait briefly
      if (isLoading && !effectiveUser) {
        return;
      }

      // 2. Fetch public profile via API / service
      try {
        let p = await fetchPublicProfile(userId);

        if (!p) {
          // DevStore direct check
          const local = devStore.getProfile(userId);
          if (local) {
            p = devStore.toPublicProfile(local);
          } else {
            // Check all devStore candidates
            const all = devStore.getDiscoveryCandidates("usr-temp");
            p = all.find(
              (c) =>
                c.id === userId ||
                c.unique_id === userId ||
                getMemberId(c).toLowerCase() === userId.toLowerCase()
            ) || null;
          }
        }

        if (isMounted) {
          setProfile(p);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [userId, user, effectiveUser, isSelf, isLoading]);

  // Check if target user liked current user
  useEffect(() => {
    const currentId = effectiveUser?.id || devStore.getCurrentUserId();
    if (currentId && profile && currentId !== profile.id) {
      fetchIncomingLikes(currentId).then((likes) => {
        const found = likes.some(
          (l) => l.id === profile.id || l.unique_id === profile.unique_id
        );
        if (found || isFromLikesParam) {
          setIsAdmirer(true);
        }
      });
    }
  }, [effectiveUser, profile, isFromLikesParam]);

  const handleLike = async () => {
    if (!profile || actionLoading) return;
    const actorId = effectiveUser?.id || devStore.getCurrentUserId();
    setActionLoading(true);

    try {
      const res = await submitSwipe(actorId, profile.id, "like");

      if (res.isMatch || isAdmirer) {
        const matchRes = await ensureUserMatch(profile.id);

        setMatchSuccess(true);
        try {
          confetti({
            particleCount: 140,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#e11d48", "#f59e0b", "#8b5cf6", "#10b981"],
          });
        } catch {
          // Confetti fallback
        }

        setTimeout(() => {
          router.push(`/chat/${matchRes.matchId}?matched=true`);
        }, 1100);
      } else {
        router.push("/discover");
      }
    } catch (err) {
      console.error("Error submitting like:", err);
      if (isAdmirer) {
        const matchRes = await ensureUserMatch(profile.id);
        setMatchSuccess(true);
        setTimeout(() => {
          router.push(`/chat/${matchRes.matchId}?matched=true`);
        }, 900);
      } else {
        router.push("/discover");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (!profile || actionLoading) return;
    const actorId = effectiveUser?.id || devStore.getCurrentUserId();
    setActionLoading(true);
    await submitSwipe(actorId, profile.id, "pass");
    router.push("/discover");
  };

  const handleBlock = async () => {
    if (!profile) return;
    const actorId = effectiveUser?.id || devStore.getCurrentUserId();
    await blockMember(actorId, profile.id);
    setBlocked(true);
    setTimeout(() => router.push("/discover"), 1500);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-xs text-muted-foreground">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto space-y-4 px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mx-auto">
          <X className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold">Profile not found</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          এই ব্যবহারকারীর প্রোফাইলটি ব্যক্তিগত বা সাময়িকভাবে অনুপলব্ধ হতে পারে।
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
          >
            Go Back
          </button>
          <Link href="/discover" className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold">
            Explore Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {isSelf ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Link>
          ) : (
            <Link
              href={`/safety/report/${profile.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive transition-colors"
              title="Report this member"
            >
              <Flag className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Preview Card Notice for Self */}
      {isSelf && (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-xs text-primary font-medium flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span><strong>পাবলিক প্রিভিউ:</strong> অন্য সদস্যরা আপনার কার্ডটি ঠিক এইভাবেই দেখতে পান।</span>
          </div>
          <Link
            href="/profile"
            className="px-3 py-1 rounded-xl bg-primary text-white text-[11px] font-bold shrink-0 hover:opacity-90"
          >
            Edit
          </Link>
        </div>
      )}

      {/* Admirer Match Notice - If user was in Likes You */}
      {!isSelf && isAdmirer && !matchSuccess && (
        <div className="mb-4 p-4 rounded-3xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-transparent border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/30 shrink-0">
              <Heart className="h-5 w-5 fill-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {profile.display_name} আপনাকে লাইক করেছেন!
              </p>
              <p className="text-[11px] text-muted-foreground">
                এখনই অ্যাড করুন এবং সরাসরি আড্ডা শুরু করুন।
              </p>
            </div>
          </div>

          <button
            onClick={handleLike}
            disabled={actionLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            <span>{actionLoading ? "অ্যাড করা হচ্ছে..." : "অ্যাড করুন (Match Now)"}</span>
          </button>
        </div>
      )}

      {/* Match Celebration Banner */}
      {matchSuccess && (
        <div className="mb-4 p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-in zoom-in-95 flex items-center justify-center gap-2 shadow-lg">
          <Check className="h-5 w-5" />
          <span>🎉 অভিনন্দন! ম্যাচ তৈরি হয়েছে। চ্যাটে নিয়ে যাওয়া হচ্ছে...</span>
        </div>
      )}

      {blocked && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive font-semibold text-center">
          সদস্যকে সফলভাবে ব্লক করা হয়েছে।
        </div>
      )}

      {/* Main Card View */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {/* Photo Preview */}
        <div className="relative aspect-[3/3.8] bg-secondary">
          <img
            src={profile.primary_photo_url || profile.photos[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black">{profile.display_name}, {profile.age}</h1>
              <BlueTickBadge profile={profile} size="lg" />
              <span className="rounded-full bg-rose-500/90 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide shadow-sm">
                ID: {getMemberId(profile)}
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-0.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{profile.city} • {profile.gender}</span>
            </p>
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

          {(profile.job_title || profile.education) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {profile.job_title && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/60 text-foreground">
                  <Briefcase className="h-4 w-4 text-primary shrink-0" />
                  <span>{profile.job_title}</span>
                </div>
              )}
              {profile.education && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/60 text-foreground">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  <span>{profile.education}</span>
                </div>
              )}
            </div>
          )}

          {profile.dating_intentions && profile.dating_intentions.length > 0 && (
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

          {profile.interests && profile.interests.length > 0 && (
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

          {profile.prompts && profile.prompts.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Conversation Starters</h3>
              {profile.prompts.map((pr) => (
                <div key={pr.id} className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                  <p className="text-xs font-semibold text-rose-500">“{pr.question}”</p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{pr.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Safety Actions */}
          {!isSelf && (
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
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      {isSelf ? (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            href="/profile"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit My Profile</span>
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePass}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full border border-border bg-card text-foreground shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-xs font-bold"
            title="Pass"
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span>পাস (Pass)</span>
          </button>

          <button
            onClick={handleLike}
            disabled={actionLoading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-xs font-bold"
            title={isAdmirer ? "অ্যাড করুন এবং চ্যাট শুরু করুন" : "লাইক করুন"}
          >
            {isAdmirer ? <UserCheck className="h-4 w-4" /> : <Heart className="h-4 w-4 fill-white" />}
            <span>
              {actionLoading
                ? "অ্যাড হচ্ছে..."
                : isAdmirer
                ? "অ্যাড করুন (Match Now)"
                : "লাইক করুন (Like)"}
            </span>
          </button>
        </div>
      )}
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
