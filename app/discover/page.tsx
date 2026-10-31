"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Heart, 
  X, 
  Info, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  ShieldAlert, 
  RotateCcw,
  MessageCircle,
  CheckCircle2,
  SlidersHorizontal,
  Search,
  Coffee,
  Send,
  Check,
  User,
  Compass
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchDiscoveryCandidates, submitSwipe, searchMembers } from "@/lib/services/matching-service";
import { PublicProfile } from "@/types/database";
import { cn } from "@/lib/utils";
import { getMemberId } from "@/lib/utils/member-id";
import { BlueTickBadge } from "@/components/ui/blue-tick-badge";
import { formatDistanceBengali } from "@/lib/services/geo-service";
import { fetchUserPreferences, saveUserPreferences } from "@/lib/services/preferences-service";

const POPULAR_VENUES = [
  "☕ ধানমন্ডি রবীন্দ্র সরোবর",
  "🌿 গুলশান লেকপার্ক ক্যাফে",
  "🥐 বেইলিরোড আড্ডা কর্নার",
  "🏙️ বনানী কফি লাউঞ্জ",
  "🎓 বিশ্ববিদ্যালয় ক্যাম্পাস চায়ের দোকান",
  "🌊 পতেঙ্গা সমুদ্র সৈকত (চট্টগ্রাম)",
];

export default function DiscoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<PublicProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inspectProfile, setInspectProfile] = useState<PublicProfile | null>(null);
  const [matchModal, setMatchModal] = useState<{ isOpen: boolean; matchId?: string; matchedUser?: PublicProfile }>({
    isOpen: false,
  });

  // Tea Invite Bottom Sheet / Modal State
  const [teaInviteModal, setTeaInviteModal] = useState<{
    isOpen: boolean;
    candidate?: PublicProfile;
  }>({ isOpen: false });
  const [selectedVenue, setSelectedVenue] = useState(POPULAR_VENUES[0]);
  const [customTeaNote, setCustomTeaNote] = useState("এক কাপ ধোঁয়া ওঠা চা আর চমৎকার আড্ডার দাওয়াত রইল!");
  const [inviteSending, setInviteSending] = useState(false);

  // Distance Radius Filter State
  const [radiusFilter, setRadiusFilter] = useState<number>(50);
  const [showRadiusModal, setShowRadiusModal] = useState<boolean>(false);

  // Search State for Member ID / Name Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const isSearching = searchQuery.trim().length > 0;

  // Motion values for swipe gesture
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-10, -100], [0, 1]);

  // Load user's saved distance preferences and listen for updates
  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      fetchUserPreferences(user.id).then((prefs) => {
        if (isMounted && typeof prefs.max_distance_km === "number") {
          setRadiusFilter(prefs.max_distance_km);
        }
      });
    }

    const handlePrefsChange = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.max_distance_km) {
        setRadiusFilter(custom.detail.max_distance_km);
      }
    };
    window.addEventListener("cha_adda_preferences_changed", handlePrefsChange);

    return () => {
      isMounted = false;
      window.removeEventListener("cha_adda_preferences_changed", handlePrefsChange);
    };
  }, [user?.id]);

  useEffect(() => {
    async function loadCandidates() {
      if (!user) return;
      setLoading(true);
      try {
        const list = await fetchDiscoveryCandidates(user.id, {
          maxDistanceKm: radiusFilter,
        });
        setCandidates(list);
        setCurrentIndex(0);
        setActivePhotoIndex(0);
      } catch (err) {
        console.error("Error loading candidates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [user, radiusFilter]);

  const handleUpdateRadius = async (newKm: number) => {
    setRadiusFilter(newKm);
    setShowRadiusModal(false);
    if (user?.id) {
      await saveUserPreferences(user.id, { max_distance_km: newKm });
    }
  };

  // Search Debounced Effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      if (!user) {
        setSearchLoading(false);
        return;
      }
      try {
        const results = await searchMembers(trimmed, user.id);
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  // Trigger celebratory confetti on match
  useEffect(() => {
    if (matchModal.isOpen) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#e11d48", "#f43f5e", "#fb7185", "#f59e0b", "#10b981"],
        });
      } catch {
        // Fallback gracefully if canvas unavailable
      }
    }
  }, [matchModal.isOpen]);

  const currentCandidate = candidates[currentIndex];

  const candidatePhotos = currentCandidate?.photos && currentCandidate.photos.length > 0
    ? currentCandidate.photos.map((p) => p.url)
    : currentCandidate?.primary_photo_url
    ? [currentCandidate.primary_photo_url]
    : ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"];

  const currentPhoto = candidatePhotos[activePhotoIndex] || candidatePhotos[0];

  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback
      }
    }
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activePhotoIndex > 0) {
      triggerHaptic(10);
      setActivePhotoIndex((prev) => prev - 1);
    }
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activePhotoIndex < candidatePhotos.length - 1) {
      triggerHaptic(10);
      setActivePhotoIndex((prev) => prev + 1);
    }
  };

  const handleSwipeAction = async (action: "like" | "pass" | "superlike" | "tea_invite") => {
    if (!user || !currentCandidate) return;

    const target = currentCandidate;
    triggerHaptic(action === "pass" ? 20 : [25, 45]);

    // Optimistically advance index
    setCurrentIndex((prev) => prev + 1);
    setActivePhotoIndex(0);

    try {
      const result = await submitSwipe(user.id, target.id, action);
      if (result.isMatch) {
        setMatchModal({
          isOpen: true,
          matchId: result.matchId,
          matchedUser: target,
        });
      }
    } catch (err) {
      console.error("Swipe submission error:", err);
    } finally {
      x.set(0);
    }
  };

  const handleLike = () => handleSwipeAction("like");
  const handlePass = () => handleSwipeAction("pass");
  const handleSuperlike = () => handleSwipeAction("superlike");

  const openTeaInviteModal = (candidate: PublicProfile) => {
    setTeaInviteModal({
      isOpen: true,
      candidate,
    });
  };

  const handleSendTeaInvite = async () => {
    if (!user || !teaInviteModal.candidate) return;
    setInviteSending(true);
    const target = teaInviteModal.candidate;

    try {
      triggerHaptic([30, 60]);
      const result = await submitSwipe(
        user.id,
        target.id,
        "tea_invite",
        customTeaNote,
        selectedVenue
      );
      setTeaInviteModal({ isOpen: false });

      // Advance index if inspecting active candidate
      if (currentCandidate && currentCandidate.id === target.id) {
        setCurrentIndex((prev) => prev + 1);
        setActivePhotoIndex(0);
      }

      if (result.isMatch) {
        setMatchModal({
          isOpen: true,
          matchId: result.matchId,
          matchedUser: target,
        });
      }
    } catch (err) {
      console.error("Tea invite error:", err);
    } finally {
      setInviteSending(false);
    }
  };

  // Keyboard navigation for desktop UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inspectProfile || matchModal.isOpen || teaInviteModal.isOpen) return;
      if (e.key === "ArrowLeft") handlePass();
      if (e.key === "ArrowRight") handleLike();
      if (e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        handleNextPhoto();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const current = candidates[currentIndex];
        if (current) setInspectProfile(current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, candidates, inspectProfile, matchModal, teaInviteModal, activePhotoIndex]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const threshold = 90;
    if (info.offset.x > threshold) {
      handleLike();
    } else if (info.offset.x < -threshold) {
      handlePass();
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-3 sm:p-6 overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Top Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Search Bar & Quick Distance Radius Trigger */}
      <div className="w-full max-w-sm mb-3 sm:mb-4 relative z-30 flex items-center gap-2">
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Member ID or Name..."
            className="w-full rounded-2xl border border-border/80 bg-card/90 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 shadow-lg backdrop-blur-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick Distance Filter Trigger */}
        <button
          type="button"
          onClick={() => setShowRadiusModal(true)}
          title="দূরত্ব ফিল্টার পরিবর্তন করুন"
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-rose-500/40 bg-card/90 hover:bg-rose-500/10 text-rose-500 text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 shrink-0"
        >
          <Compass className="h-4 w-4" />
          <span>{radiusFilter >= 300 ? "সারাদেশ" : `${radiusFilter}km`}</span>
        </button>
      </div>

      {isSearching ? (
        <div className="w-full max-w-sm flex-1 max-h-[580px] overflow-y-auto rounded-3xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl relative z-30 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border shrink-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Search Results ({searchResults.length})
            </span>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Back to Swipe
            </button>
          </div>

          {searchLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 animate-spin text-primary" />
              <span>Searching member network...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-16 text-center max-w-xs mx-auto">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold">No members found</h4>
              <p className="text-xs text-muted-foreground mt-1">
                No active member matched &quot;{searchQuery}&quot;. Please verify the Member ID (e.g. CHA-XXXXX) or name.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto">
              {searchResults.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-background/60 hover:bg-secondary/40 transition-all gap-3"
                >
                  <div
                    onClick={() => setInspectProfile(member)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-border/80 bg-secondary">
                      <img
                        src={member.primary_photo_url || member.photos?.[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
                        alt={member.display_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm truncate text-foreground">
                          {member.display_name}, {member.age}
                        </span>
                        <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                          ID: {getMemberId(member)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {member.city} {typeof member.approx_distance_km === "number" ? `• ${formatDistanceBengali(member.approx_distance_km)}` : ""} {member.job_title ? `• ${member.job_title}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openTeaInviteModal(member)}
                      title="চা খাওয়ার দাওয়াত পাঠান"
                      className="p-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors"
                    >
                      <Coffee className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setInspectProfile(member)}
                      className="px-2.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-20">
          <Sparkles className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold">Discovering authentic people nearby...</p>
        </div>
      ) : currentIndex >= candidates.length || !currentCandidate ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center max-w-sm p-7 rounded-3xl border border-border/80 bg-card shadow-xl backdrop-blur-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500 mb-3">
            <Compass className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black tracking-tight">নতুন কোনো মেম্বার পাওয়া যায়নি</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            আপনার নির্ধারিত <strong className="text-foreground">{radiusFilter >= 300 ? "সারাদেশের" : `${radiusFilter} কিলোমিটার`}</strong> দূরত্বের মধ্যে নতুন আর কেউ বাকি নেই। দূরত্ব ফিল্টার বাড়িয়ে আরও মানুষ খুঁজে নিতে পারেন।
          </p>
          <div className="mt-5 flex flex-col gap-2 w-full">
            {radiusFilter < 50 && (
              <button
                type="button"
                onClick={() => handleUpdateRadius(50)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all"
              >
                <span>দূরত্ব বাড়িয়ে ৫০ কিমি করুন 📍</span>
              </button>
            )}
            {radiusFilter < 100 && (
              <button
                type="button"
                onClick={() => handleUpdateRadius(100)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all"
              >
                <span>দূরত্ব বাড়িয়ে ১০০ কিমি করুন 🚗</span>
              </button>
            )}
            {radiusFilter < 300 && (
              <button
                type="button"
                onClick={() => handleUpdateRadius(300)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>পুরো বাংলাদেশ দেখুন (All Bangladesh)</span>
              </button>
            )}
            <button
              onClick={async () => {
                if (user) {
                  setLoading(true);
                  const list = await fetchDiscoveryCandidates(user.id, { maxDistanceKm: radiusFilter });
                  setCandidates(list);
                  setCurrentIndex(0);
                  setActivePhotoIndex(0);
                  setLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border bg-secondary/60 text-xs font-semibold hover:bg-secondary transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>ফীড পুনরায় রিফ্রেশ করুন</span>
            </button>
            <Link
              href="/settings"
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border bg-secondary/30 text-xs font-semibold hover:bg-secondary transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>সেটিংস থেকে ফিল্টার কনফিগার করুন</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Card Deck */
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-[3/4.2] select-none">
          {/* Background Card Preview */}
          {candidates[currentIndex + 1] && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden scale-[0.94] translate-y-3 opacity-60 border border-border bg-card shadow-md pointer-events-none">
              <img
                src={candidates[currentIndex + 1].primary_photo_url || candidates[currentIndex + 1].photos[0]?.url}
                alt="Next candidate"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Active Swipeable Card */}
          <motion.div
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card cursor-grab active:cursor-grabbing touch-none"
          >
            {/* Story-Style Progress Bars at Top */}
            <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5 pointer-events-none">
              {candidatePhotos.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-200",
                    idx === activePhotoIndex ? "bg-white shadow-md" : "bg-white/35"
                  )}
                />
              ))}
            </div>

            {/* Tap Zones: Left 35% for Prev Photo, Right 65% for Next Photo */}
            <div className="absolute inset-0 z-10 flex">
              <div
                onClick={handlePrevPhoto}
                className="w-[35%] h-full cursor-pointer active:bg-black/5 transition-colors"
                title="Previous photo"
              />
              <div
                onClick={handleNextPhoto}
                className="w-[65%] h-full cursor-pointer active:bg-black/5 transition-colors"
                title="Next photo"
              />
            </div>

            {/* Stamp Overlays */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-7 left-6 z-20 rounded-2xl border-4 border-emerald-500 bg-emerald-950/80 px-4 py-1.5 text-2xl font-black uppercase tracking-wider text-emerald-400 rotate-[-12deg] shadow-lg pointer-events-none"
            >
              LIKE
            </motion.div>

            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-7 right-6 z-20 rounded-2xl border-4 border-rose-500 bg-rose-950/80 px-4 py-1.5 text-2xl font-black uppercase tracking-wider text-rose-400 rotate-[12deg] shadow-lg pointer-events-none"
            >
              PASS
            </motion.div>

            {/* Profile Photo */}
            <img
              src={currentPhoto}
              alt={currentCandidate.display_name}
              className="w-full h-full object-cover pointer-events-none transition-all duration-300"
            />

            {/* Bottom Gradient Veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

            {/* Profile Info Overlay */}
            <div className="absolute bottom-20 left-5 right-5 text-white pointer-events-none z-20">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {currentCandidate.display_name}, {currentCandidate.age}
                </h2>
                <BlueTickBadge profile={currentCandidate} size="lg" />
                <span className="rounded-full bg-rose-500/80 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide shadow-sm">
                  ID: {getMemberId(currentCandidate)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-rose-200 mt-1 font-medium flex-wrap">
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  <MapPin className="h-3 w-3 text-rose-400" />
                  <span>{currentCandidate.city}</span>
                  {typeof currentCandidate.approx_distance_km === "number" && (
                    <span className="text-white font-bold ml-0.5">
                      • {formatDistanceBengali(currentCandidate.approx_distance_km)}
                    </span>
                  )}
                </span>
                {currentCandidate.job_title && (
                  <span className="flex items-center gap-1 truncate bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                    <Briefcase className="h-3 w-3" />
                    <span>{currentCandidate.job_title}</span>
                  </span>
                )}
              </div>

              {currentCandidate.bio && (
                <p className="mt-2 text-xs text-gray-200 line-clamp-2 leading-relaxed">
                  {currentCandidate.bio}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {currentCandidate.dating_intentions?.slice(0, 1).map((intent) => (
                  <span
                    key={intent}
                    className="rounded-full bg-rose-500/80 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md"
                  >
                    🎯 {intent}
                  </span>
                ))}
                {currentCandidate.interests?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Details Inspection Trigger */}
            <button
              onClick={() => setInspectProfile(currentCandidate)}
              className="absolute bottom-20 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-colors"
              aria-label="Inspect profile details"
            >
              <Info className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Floating Action Controls */}
          <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-3 sm:gap-4 z-30">
            {/* Pass Button */}
            <button
              onClick={handlePass}
              aria-label="Pass profile"
              className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-rose-500/30 bg-card text-rose-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
            >
              <X className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.5px]" />
            </button>

            {/* Tea Invite Button (Cultural Superlike) */}
            <button
              onClick={() => openTeaInviteModal(currentCandidate)}
              aria-label="চা খাওয়ার দাওয়াত পাঠান"
              title="চা খাওয়ার দাওয়াত পাঠান (Send Tea Invite)"
              className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border border-amber-500/40 bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 hover:scale-110 active:scale-95 transition-all relative group"
            >
              <Coffee className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute -top-7 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/30 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                চা দাওয়াত ☕
              </span>
            </button>

            {/* Superlike Button */}
            <button
              onClick={handleSuperlike}
              aria-label="Superlike profile"
              className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-sky-500/30 bg-card text-sky-400 shadow-md hover:scale-110 active:scale-95 transition-all"
            >
              <Sparkles className="h-5 w-5" />
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              aria-label="Like profile"
              className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-500/40 hover:scale-110 active:scale-95 transition-all"
            >
              <Heart className="h-7 w-7 sm:h-8 sm:w-8 fill-white" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Profile Inspector Modal */}
      {inspectProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-2xl">
            <button
              onClick={() => setInspectProfile(null)}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-6">
              {/* Profile Photo Header */}
              <div className="relative aspect-[3/3.8] rounded-2xl overflow-hidden border border-border bg-secondary shadow-md">
                <img
                  src={inspectProfile.primary_photo_url || inspectProfile.photos?.[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
                  alt={inspectProfile.display_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-black">
                      {inspectProfile.display_name}, {inspectProfile.age}
                    </h2>
                    <BlueTickBadge profile={inspectProfile} size="lg" />
                    <span className="rounded-full bg-rose-500/90 border border-white/20 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      ID: {getMemberId(inspectProfile)}
                    </span>
                  </div>
                  <p className="text-xs text-rose-200 mt-1 flex items-center gap-1.5 flex-wrap">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    <span>{inspectProfile.city}</span>
                    {typeof inspectProfile.approx_distance_km === "number" && (
                      <span className="bg-rose-500/30 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] text-white font-bold">
                        {formatDistanceBengali(inspectProfile.approx_distance_km)}
                      </span>
                    )}
                    {inspectProfile.job_title ? `• ${inspectProfile.job_title}` : ""}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {inspectProfile.bio && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About Me</h3>
                  <p className="text-sm leading-relaxed text-foreground">{inspectProfile.bio}</p>
                </div>
              )}

              {/* Hinge-style Prompt Cards (চা ও আড্ডা বিশেষত্ব) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5 text-amber-500" />
                  <span>চা ও আড্ডা প্রশ্নাবলী (Prompts)</span>
                </h3>
                {(inspectProfile.prompts || [
                  { id: "pr-1", question: "আমার পারফেক্ট শুক্রবারের আড্ডা...", answer: "এক কাপ কড়া দুধ চা আর চমৎকার কোনো জায়গায় প্রিয় মানুষের সাথে নির্ভেজাল গল্প।" },
                  { id: "pr-2", question: "যে বিষয়ে আমার সাথে ঘণ্টার পর ঘণ্টা তর্ক করা যাবে...", answer: "চা নাকি কফি, আর প্রিয় ভ্রমণ স্মৃতি নিয়ে!" },
                  { id: "pr-3", question: "আমার প্রিয় মিষ্টি বা স্ন্যাক্স...", answer: "চায়ের সাথে মুচমুচে গরম সিঙ্গাড়া অথবা বাকরখানি।" },
                ]).map((prompt) => (
                  <div
                    key={prompt.id}
                    className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-background to-amber-500/5 p-4 shadow-sm"
                  >
                    <span className="text-[11px] font-bold text-rose-400 block mb-1">
                      {prompt.question}
                    </span>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      &ldquo;{prompt.answer}&rdquo;
                    </p>
                  </div>
                ))}
              </div>

              {/* Additional Photos Grid if multiple photos exist */}
              {inspectProfile.photos && inspectProfile.photos.length > 1 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {inspectProfile.photos.slice(1).map((ph, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary">
                        <img src={ph.url} alt="Profile photo" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dating Intentions */}
              {inspectProfile.dating_intentions && inspectProfile.dating_intentions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dating Intentions</h3>
                  <div className="flex flex-wrap gap-2">
                    {inspectProfile.dating_intentions.map((intent) => (
                      <span
                        key={intent}
                        className="rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-500"
                      >
                        🎯 {intent}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {inspectProfile.interests && inspectProfile.interests.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {inspectProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full bg-secondary border border-border px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions inside inspector */}
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <button
                  onClick={() => {
                    setInspectProfile(null);
                    openTeaInviteModal(inspectProfile);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition-all"
                >
                  <Coffee className="h-4 w-4" />
                  <span>চা খাওয়ার দাওয়াত পাঠান ☕</span>
                </button>

                <Link
                  href={`/profile/${inspectProfile.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>View Full Profile Page</span>
                </Link>

                <div className="flex items-center justify-between text-xs pt-1">
                  <Link
                    href={`/safety/report/${inspectProfile.id}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Report {inspectProfile.display_name}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setInspectProfile(null);
                      handlePass();
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Pass on profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tea Invite Bottom Sheet / Modal */}
      {teaInviteModal.isOpen && teaInviteModal.candidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-card p-6 shadow-2xl">
            <button
              onClick={() => setTeaInviteModal({ isOpen: false })}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 shrink-0">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black">চা খাওয়ার দাওয়াত পাঠান ☕</h3>
                <p className="text-xs text-muted-foreground">
                  Send a personalized Tea Invite to <strong className="text-foreground">{teaInviteModal.candidate.display_name}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Venue Selector */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">
                  আড্ডার স্থান নির্বাচন করুন (Suggested Venue)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_VENUES.map((venue) => (
                    <button
                      key={venue}
                      type="button"
                      onClick={() => setSelectedVenue(venue)}
                      className={cn(
                        "text-left p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5",
                        selectedVenue === venue
                          ? "border-amber-500 bg-amber-500/10 text-amber-500 font-bold"
                          : "border-border bg-secondary/50 hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      <span className="truncate">{venue}</span>
                      {selectedVenue === venue && <Check className="h-3 w-3 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Note */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  একটি সুন্দর আমন্ত্রণ বার্তা (Personal Note)
                </label>
                <textarea
                  rows={3}
                  maxLength={140}
                  value={customTeaNote}
                  onChange={(e) => setCustomTeaNote(e.target.value)}
                  placeholder="বৃষ্টির দিনে এক কাপ চা আর চমৎকার আড্ডার দাওয়াত রইল..."
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs sm:text-sm placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-muted-foreground text-right block mt-1">
                  {customTeaNote.length}/140 অক্ষর
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={inviteSending}
                onClick={handleSendTeaInvite}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {inviteSending ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>দাওয়াত পাঠান (Send Tea Invite ☕)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Reciprocal Match Celebration Modal */}
      {matchModal.isOpen && matchModal.matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <div className="text-center max-w-sm sm:max-w-md w-full p-6 sm:p-8 rounded-3xl border border-rose-500/40 bg-card shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-rose-500/25 to-transparent pointer-events-none" />

            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-500/40 mb-3 animate-bounce">
              <Heart className="h-8 w-8 fill-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight gradient-text-primary">
              ইটস এ ম্যাচ! (It’s a Match!)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              You and <strong className="text-foreground">{matchModal.matchedUser.display_name}</strong> both liked each other! এক কাপ চায়ের আড্ডা শুরু হোক।
            </p>

            {/* Paired Photos Animation */}
            <div className="flex items-center justify-center -space-x-5 my-6">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-card shadow-xl ring-2 ring-primary animate-in slide-in-from-left duration-500">
                <img
                  src={user?.id === "usr-aria-01" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-card shadow-xl ring-2 ring-amber-500 animate-in slide-in-from-right duration-500">
                <img
                  src={matchModal.matchedUser.primary_photo_url || matchModal.matchedUser.photos[0]?.url}
                  alt={matchModal.matchedUser.display_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Icebreaker Suggestions */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                দ্রুত কথা শুরু করুন (Quick Icebreaker)
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {[
                  "☕ চা নাকি কফি?",
                  "☕ ধানমন্ডি লেকে এক কাপ চা?",
                  "👋 হাই! আড্ডা দেওয়া যাক?",
                ].map((icebreaker) => (
                  <button
                    key={icebreaker}
                    type="button"
                    onClick={() => {
                      router.push(`/chat/${matchModal.matchId || "demo"}?starter=${encodeURIComponent(icebreaker)}`);
                    }}
                    className="px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 transition-all text-left"
                  >
                    {icebreaker}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <Link
                href={`/chat/${matchModal.matchId || "demo"}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-500/25 hover:opacity-95 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>চ্যাট শুরু করুন (Open Chat)</span>
              </Link>
              <button
                type="button"
                onClick={() => setMatchModal({ isOpen: false })}
                className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Distance Radius Filter Modal */}
      {showRadiusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">দূরত্ব ফিল্টার (Distance Radius)</h3>
                  <p className="text-[10px] text-muted-foreground">আপনার চারপাশের কত দূরত্বের মানুষ দেখবেন?</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRadiusModal(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">নির্বাচিত সর্বোচ্চ দূরত্ব:</span>
                <span className="font-bold text-rose-500 font-mono">
                  {radiusFilter >= 300 ? "পুরো বাংলাদেশ (All)" : `${radiusFilter} কিমি`}
                </span>
              </div>

              <input
                type="range"
                min={5}
                max={300}
                step={5}
                value={radiusFilter}
                onChange={(e) => setRadiusFilter(Number(e.target.value))}
                className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-rose-500"
              />

              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>৫ কিমি</span>
                <span>৫০ কিমি</span>
                <span>১০০ কিমি</span>
                <span>৩০০+ কিমি (সারাদেশ)</span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { label: "১০ কিমি", val: 10 },
                  { label: "২৫ কিমি", val: 25 },
                  { label: "৫০ কিমি", val: 50 },
                  { label: "১০০ কিমি", val: 100 },
                  { label: "১৫০ কিমি", val: 150 },
                  { label: "সারাদেশ", val: 300 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setRadiusFilter(p.val)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      radiusFilter === p.val
                        ? "border-rose-500 bg-rose-500/10 text-rose-500 shadow-sm font-bold"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/80">
              <Link
                href="/settings"
                onClick={() => setShowRadiusModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1"
              >
                <span>আরও সেটিংস</span>
              </Link>
              <button
                type="button"
                onClick={() => handleUpdateRadius(radiusFilter)}
                className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all"
              >
                ফিল্টার প্রয়োগ করুন 🎯
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
