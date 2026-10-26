"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Check, 
  CheckCheck, 
  Edit3, 
  Settings, 
  Sparkles, 
  Copy,
  Coffee,
  ShieldCheck,
  Clock,
  AlertCircle,
  Eye,
  X,
  ExternalLink,
  MapPin
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { getMemberId } from "@/lib/utils/member-id";
import { isProfileVerified, getVerificationDetails } from "@/lib/utils/verification";
import { BlueTickBadge } from "@/components/ui/blue-tick-badge";
import { VerificationRequest, ProfilePhoto } from "@/types/database";
import { submitSelfieVerification, fetchMyVerificationStatus } from "@/lib/services/verification-service";
import { SelfieCameraModal } from "@/components/profile/selfie-camera-modal";
import { calculateAge } from "@/lib/utils";
import { devStore } from "@/lib/services/dev-store";

export default function ProfilePage() {
  const { user, updateCurrentProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [city, setCity] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Prompts state
  const [prompt1, setPrompt1] = useState("এক কাপ কড়া দুধ চা আর চমৎকার কোনো জায়গায় প্রিয় মানুষের সাথে নির্ভেজাল গল্প।");
  const [prompt2, setPrompt2] = useState("চা নাকি কফি, আর প্রিয় ভ্রমণ স্মৃতি নিয়ে!");
  const [prompt3, setPrompt3] = useState("চায়ের সাথে মুচমুচে গরম সিঙ্গাড়া অথবা বাকরখানি।");

  // Selfie Verification State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      fetchMyVerificationStatus(user.id).then((req) => {
        if (isMounted && req) setVerificationRequest(req);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSelfieSubmit = async (selfieDataUrl: string): Promise<boolean> => {
    if (!user) return false;
    const res = await submitSelfieVerification(user.id, selfieDataUrl);
    if (res.success && res.request) {
      setVerificationRequest(res.request);
      return true;
    }
    return false;
  };

  if (!user) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  const calculatedAge = calculateAge(user.date_of_birth || "2000-01-01");
  const age = Math.max(18, isNaN(calculatedAge) ? 18 : calculatedAge);

  const memberId = getMemberId(user);
  const hasBlueTick = isProfileVerified(user);
  const verificationDetails = getVerificationDetails(user);

  const userPhotos: ProfilePhoto[] = user?.id ? devStore.getPhotos(user.id) : [];
  const primaryPhoto = userPhotos.find((p) => p.is_primary) || userPhotos[0];
  const avatarUrl = primaryPhoto?.url || (user.gender === "woman" 
    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80");

  const handleCopyId = () => {
    navigator.clipboard.writeText(memberId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentProfile({
      display_name: displayName,
      bio,
      job_title: jobTitle,
      city,
    });
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner & Avatar Header */}
      <div className="relative rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl backdrop-blur-md overflow-hidden">
        {/* Background gradient banner */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-rose-600/30 via-pink-600/20 to-amber-500/25" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pt-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative h-24 w-24 rounded-3xl overflow-hidden border-4 border-card shadow-xl ring-2 ring-primary bg-secondary shrink-0">
              <img
                src={avatarUrl}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black">{user.display_name}, {age}</h1>
                <BlueTickBadge profile={user} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.city} • {user.gender}
              </p>

              {/* Unique Member ID Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-400">
                <span>ID: {memberId}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Copy Member ID"
                  className="p-0.5 text-rose-400 hover:text-white transition-colors"
                >
                  {copiedId ? (
                    <CheckCheck className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Preview how other members see your public card"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Card</span>
            </button>
            <button
              onClick={() => {
                setDisplayName(user.display_name);
                setBio(user.bio || "");
                setJobTitle(user.job_title || "");
                setCity(user.city);
                setIsEditing(!isEditing);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Conditional Verification Bar:
            1. If user already has active Blue Tick: AUTO VANISH the "সেলফি ভেরিফিকেশন (Blue Tick)" text and button!
               Instead show the official active verified badge with expiry duration details.
            2. If user submitted selfie and it is pending review: Show Under Review banner (Auto-vanish verify button).
            3. If user's request was rejected: Show rejection reason and button to retake.
            4. Otherwise: Show the Selfie Verification trigger button.
        */}
        {hasBlueTick ? (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20 shrink-0">
                <Check className="h-4 w-4 stroke-[3]" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <span>অফিশিয়াল ব্লু টিক সক্রিয়</span>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-300 font-mono">
                    {verificationDetails.badgeTextBengali}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  আপনার প্রোফাইলটি সফলভাবে যাচাইকৃত ও বিশ্বস্ত • মেয়াদ: {verificationDetails.formattedExpiry}
                </p>
              </div>
            </div>
            <div className="self-end sm:self-center">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/15 px-2.5 py-1 rounded-full border border-sky-500/25">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified</span>
              </span>
            </div>
          </div>
        ) : verificationRequest?.status === "pending" ? (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-amber-500">
                  <span>সেলফি যাচাই অপেক্ষমান (Under Review)</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  আপনার লাইভ সেলফি সফলভাবে জমা হয়েছে। অ্যাডমিন প্যানেলে যাচাই চলছে, অনুমোদন হলেই ব্লু টিক চালু হবে।
                </p>
              </div>
            </div>
            <div className="self-end sm:self-center">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/25">
                Pending Review ⏳
              </span>
            </div>
          </div>
        ) : verificationRequest?.status === "rejected" ? (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/20 text-destructive shrink-0">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-destructive">
                  <span>সেলফি যাচাই বাতিল হয়েছে</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  কারণ: {verificationRequest.rejection_reason || "মুখমণ্ডল অস্পষ্ট ছিল। অনুগ্রহ করে পর্যাপ্ত আলোতে পুনরায় চেষ্টা করুন।"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVerificationModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-[11px] transition-colors shadow-sm shrink-0 self-end sm:self-center"
            >
              আবার সেলফি তুলুন 📸
            </button>
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-between p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              <div>
                <span className="font-semibold text-foreground block">সেলফি ভেরিফিকেশন (Blue Tick)</span>
                <span className="text-[10px] text-muted-foreground">
                  {verificationDetails.isExpired
                    ? "আপনার আগের ব্লু টিকের মেয়াদ শেষ হয়েছে। পুনরায় যাচাই করুন।"
                    : "ক্যামেরায় মুখ স্ক্যান করে প্রোফাইলে অফিশিয়াল ব্লু টিক পান"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVerificationModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] transition-colors shadow-sm shrink-0"
            >
              ভেরিফাই করুন 🛡️
            </button>
          </div>
        )}

        {savedNotice && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-center text-xs text-emerald-400 font-semibold">
            Profile changes saved successfully!
          </div>
        )}

        {/* Profile Content or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 space-y-4 pt-4 border-t border-border">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Profession
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Cultural Prompts Editor */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase text-muted-foreground block">
                চা ও আড্ডা প্রশ্নাবলী (Custom Prompts)
              </span>

              <div>
                <label className="text-[11px] font-bold text-rose-400 block mb-1">
                  আমার পারফেক্ট শুক্রবারের আড্ডা...
                </label>
                <input
                  type="text"
                  value={prompt1}
                  onChange={(e) => setPrompt1(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-rose-400 block mb-1">
                  যে বিষয়ে আমার সাথে ঘণ্টার পর ঘণ্টা তর্ক করা যাবে...
                </label>
                <input
                  type="text"
                  value={prompt2}
                  onChange={(e) => setPrompt2(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-rose-400 block mb-1">
                  আমার প্রিয় মিষ্টি বা স্ন্যাক্স...
                </label>
                <input
                  type="text"
                  value={prompt3}
                  onChange={(e) => setPrompt3(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all mt-4"
            >
              Save Profile Updates
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-5 pt-4 border-t border-border">
            {user.bio && (
              <div>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">Bio</h3>
                <p className="text-sm text-foreground/90 leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Cultural Prompts Display */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                <span>চা ও আড্ডা বিশেষত্ব</span>
              </h3>
              <div className="space-y-2">
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <span className="text-[10px] font-bold text-rose-400 block">আমার পারফেক্ট শুক্রবারের আড্ডা...</span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">&ldquo;{prompt1}&rdquo;</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <span className="text-[10px] font-bold text-rose-400 block">যে বিষয়ে ঘণ্টার পর ঘণ্টা তর্ক করা যাবে...</span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">&ldquo;{prompt2}&rdquo;</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <span className="text-[10px] font-bold text-rose-400 block">আমার প্রিয় মিষ্টি বা স্ন্যাক্স...</span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">&ldquo;{prompt3}&rdquo;</p>
                </div>
              </div>
            </div>

            {user.dating_intentions?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Dating Intentions</h3>
                <div className="flex flex-wrap gap-2">
                  {user.dating_intentions.map((intent) => (
                    <span key={intent} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                      🎯 {intent}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.interests?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {user.interests.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Banner */}
      <div className="mt-6 rounded-3xl border border-border/80 bg-card p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">CHA ADDA Premium</h4>
            <p className="text-xs text-muted-foreground">Unlock unlimited likes & see who liked you</p>
          </div>
        </div>
        <Link
          href="/subscription"
          className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
        >
          Upgrade
        </Link>
      </div>

      {/* Live Camera Selfie Verification Modal */}
      <SelfieCameraModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmitSelfie={handleSelfieSubmit}
      />

      {/* Live Public Card Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/90">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">পাবলিক কার্ড প্রিভিউ (Live Card Preview)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Card Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Photo & Overlaid Info */}
              <div className="relative aspect-[3/3.8] rounded-2xl overflow-hidden border border-border/60 bg-secondary shadow-md">
                <img
                  src={avatarUrl}
                  alt={user.display_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-xl font-black">{user.display_name}, {age}</h2>
                    <BlueTickBadge profile={user} size="md" />
                    <span className="rounded-full bg-rose-500/90 border border-white/20 px-2 py-0.5 text-[9px] font-bold text-white tracking-wide">
                      ID: {memberId}
                    </span>
                  </div>
                  <p className="text-xs text-rose-200 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{user.city} • {user.gender}</span>
                  </p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="space-y-3 px-1 text-xs">
                {user.bio ? (
                  <div>
                    <h4 className="font-bold uppercase text-[10px] text-muted-foreground mb-0.5">About Me</h4>
                    <p className="text-foreground leading-relaxed">{user.bio}</p>
                  </div>
                ) : (
                  <p className="italic text-muted-foreground">কোনো বায়ো এখনো যোগ করা হয়নি।</p>
                )}

                {(user.job_title || user.education) && (
                  <div className="p-2.5 rounded-xl bg-secondary/60 text-foreground text-xs space-y-1">
                    {user.job_title && <p>💼 {user.job_title}</p>}
                    {user.education && <p>🎓 {user.education}</p>}
                  </div>
                )}

                {user.dating_intentions && user.dating_intentions.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase text-[10px] text-muted-foreground mb-1">Dating Intentions</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {user.dating_intentions.map((d) => (
                        <span key={d} className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
                          🎯 {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {user.interests && user.interests.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase text-[10px] text-muted-foreground mb-1">Interests</h4>
                    <div className="flex flex-wrap gap-1">
                      {user.interests.map((it) => (
                        <span key={it} className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[11px]">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <h4 className="font-bold uppercase text-[10px] text-muted-foreground">Conversation Starters</h4>
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-xs space-y-1">
                    <p className="font-semibold text-rose-500">“আমার পারফেক্ট শুক্রবারের আড্ডা...”</p>
                    <p className="text-foreground/90">{prompt1}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 border-t border-border flex items-center justify-between gap-2 bg-secondary/30">
              <Link
                href={`/profile/${user.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>পূর্ণাঙ্গ পেজে ভিউ</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
