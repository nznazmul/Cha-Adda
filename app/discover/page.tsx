"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  X, 
  Info, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  ShieldAlert, 
  RotateCcw,
  MessageCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Search
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchDiscoveryCandidates, submitSwipe, searchMembers } from "@/lib/services/matching-service";
import { PublicProfile } from "@/types/database";
import { cn } from "@/lib/utils";
import { getMemberId } from "@/lib/utils/member-id";

export default function DiscoverPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<PublicProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inspectProfile, setInspectProfile] = useState<PublicProfile | null>(null);
  const [matchModal, setMatchModal] = useState<{ isOpen: boolean; matchId?: string; matchedUser?: PublicProfile }>({
    isOpen: false,
  });
  const [swipeFeedback, setSwipeFeedback] = useState<"like" | "pass" | null>(null);

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

  useEffect(() => {
    async function loadCandidates() {
      if (!user) return;
      setLoading(true);
      try {
        const list = await fetchDiscoveryCandidates(user.id);
        setCandidates(list);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Error loading candidates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [user]);

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

  const currentCandidate = candidates[currentIndex];

  const handleSwipeAction = async (action: "like" | "pass") => {
    if (!user || !currentCandidate) return;

    const target = currentCandidate;
    setSwipeFeedback(action);

    // Optimistically advance index
    setCurrentIndex((prev) => prev + 1);

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
      setTimeout(() => setSwipeFeedback(null), 400);
      x.set(0);
    }
  };

  const handleLike = () => handleSwipeAction("like");
  const handlePass = () => handleSwipeAction("pass");

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inspectProfile || matchModal.isOpen) return;
      if (e.key === "ArrowLeft") handlePass();
      if (e.key === "ArrowRight") handleLike();
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        const current = candidates[currentIndex];
        if (current) setInspectProfile(current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, candidates, inspectProfile, matchModal, currentCandidate]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleLike();
    } else if (info.offset.x < -threshold) {
      handlePass();
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Search Bar for Member ID / Name Search */}
      <div className="w-full max-w-sm mb-4 relative z-30">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Member ID (e.g. CHA-...) or Name..."
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
                        {member.city} {member.job_title ? `• ${member.job_title}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setInspectProfile(member)}
                      className="px-2.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!user) return;
                        const res = await submitSwipe(user.id, member.id, "like");
                        if (res.isMatch) {
                          setMatchModal({ isOpen: true, matchId: res.matchId, matchedUser: member });
                        }
                        setSearchQuery("");
                      }}
                      className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white hover:opacity-90 shadow-sm"
                      title="Send Like"
                    >
                      <Heart className="h-4 w-4 fill-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse-glow">
            <Heart className="h-8 w-8 animate-bounce" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            Finding compatible people near you...
          </p>
        </div>
      ) : !currentCandidate ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center max-w-sm p-8 rounded-3xl border border-border/80 bg-card shadow-xl backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">You&apos;ve seen everyone nearby!</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            There are no new candidates matching your current filters. Check back soon or broaden your discovery preferences.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 w-full">
            <button
              onClick={async () => {
                if (user) {
                  setLoading(true);
                  const list = await fetchDiscoveryCandidates(user.id);
                  setCandidates(list);
                  setCurrentIndex(0);
                  setLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Refresh Feed</span>
            </button>
            <Link
              href="/settings"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-secondary/50 text-xs font-semibold hover:bg-secondary transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Adjust Discovery Filters</span>
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
            {/* Stamp Overlays */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-6 left-6 z-20 rounded-2xl border-4 border-emerald-500 bg-emerald-950/80 px-4 py-1.5 text-2xl font-black uppercase tracking-wider text-emerald-400 rotate-[-12deg] shadow-lg pointer-events-none"
            >
              LIKE
            </motion.div>

            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-6 right-6 z-20 rounded-2xl border-4 border-rose-500 bg-rose-950/80 px-4 py-1.5 text-2xl font-black uppercase tracking-wider text-rose-400 rotate-[12deg] shadow-lg pointer-events-none"
            >
              PASS
            </motion.div>

            {/* Profile Photo */}
            <img
              src={currentCandidate.primary_photo_url || currentCandidate.photos[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
              alt={currentCandidate.display_name}
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Bottom Gradient Veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

            {/* Profile Info Overlay */}
            <div className="absolute bottom-20 left-5 right-5 text-white pointer-events-none">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {currentCandidate.display_name}, {currentCandidate.age}
                </h2>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="rounded-full bg-rose-500/80 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide shadow-sm">
                  ID: {getMemberId(currentCandidate)}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-rose-200 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{currentCandidate.city}</span>
                </span>
                {currentCandidate.job_title && (
                  <span className="flex items-center gap-1 truncate">
                    <Briefcase className="h-3.5 w-3.5" />
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
              <div className="flex flex-wrap gap-1.5 mt-3">
                {currentCandidate.dating_intentions?.slice(0, 1).map((intent) => (
                  <span
                    key={intent}
                    className="rounded-full bg-rose-500/80 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md"
                  >
                    🎯 {intent}
                  </span>
                ))}
                {currentCandidate.interests?.slice(0, 3).map((tag) => (
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
          <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-6 z-30">
            {/* Pass Button */}
            <button
              onClick={handlePass}
              aria-label="Pass profile"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/30 bg-card text-rose-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
            >
              <X className="h-7 w-7 stroke-[2.5px]" />
            </button>

            {/* Inspect Details Button */}
            <button
              onClick={() => setInspectProfile(currentCandidate)}
              aria-label="View more details"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Info className="h-5 w-5" />
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              aria-label="Like profile"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-500/40 hover:scale-110 active:scale-95 transition-all"
            >
              <Heart className="h-8 w-8 fill-white" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Profile Inspector Modal */}
      {inspectProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setInspectProfile(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Candidate Photos Gallery */}
            <div className="flex gap-2 overflow-x-auto pb-3 snap-x">
              {inspectProfile.photos.map((ph, idx) => (
                <div key={idx} className="relative min-w-[220px] aspect-[3/4] rounded-2xl overflow-hidden snap-center">
                  <img src={ph.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-extrabold">{inspectProfile.display_name}, {inspectProfile.age}</h3>
                  <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                    ID: {getMemberId(inspectProfile)}
                  </span>
                </div>
                <p className="text-xs text-rose-500 font-semibold">{inspectProfile.city} • {inspectProfile.gender}</p>
              </div>

              {inspectProfile.bio && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">About</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">{inspectProfile.bio}</p>
                </div>
              )}

              {inspectProfile.dating_intentions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Looking For</h4>
                  <div className="flex flex-wrap gap-2">
                    {inspectProfile.dating_intentions.map((intent) => (
                      <span key={intent} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                        🎯 {intent}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inspectProfile.interests?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectProfile.interests.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Action: Report Member */}
              <div className="pt-4 border-t border-border flex justify-between items-center text-xs">
                <Link
                  href={`/safety/report/${inspectProfile.id}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
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
      )}

      {/* Reciprocal Match Celebration Modal */}
      {matchModal.isOpen && matchModal.matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <div className="text-center max-w-sm sm:max-w-md w-full p-8 rounded-3xl border border-rose-500/30 bg-card shadow-2xl relative overflow-hidden">
            {/* Background Fireworks Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-rose-500/20 to-transparent pointer-events-none" />

            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl shadow-rose-500/40 mb-4 animate-bounce">
              <Heart className="h-8 w-8 fill-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight gradient-text-primary">
              It’s a Match!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              You and <strong className="text-foreground">{matchModal.matchedUser.display_name}</strong> both liked each other.
            </p>

            {/* Paired Photos */}
            <div className="flex items-center justify-center -space-x-4 my-6">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-card shadow-xl ring-2 ring-primary">
                <img
                  src={user?.id === "usr-aria-01" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-card shadow-xl ring-2 ring-rose-500">
                <img
                  src={matchModal.matchedUser.primary_photo_url || matchModal.matchedUser.photos[0]?.url}
                  alt={matchModal.matchedUser.display_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <Link
                href={`/chat/${matchModal.matchId || "demo"}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-sm font-bold text-white shadow-lg shadow-rose-500/25 hover:opacity-95 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Send a Message</span>
              </Link>
              <button
                type="button"
                onClick={() => setMatchModal({ isOpen: false })}
                className="w-full py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
