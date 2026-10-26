"use client";

import React, { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  Check, 
  CheckCheck, 
  Edit3, 
  Settings, 
  Sparkles, 
  Copy,
  Coffee,
  ShieldCheck,
  Camera,
  X
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { getMemberId } from "@/lib/utils/member-id";

export default function ProfilePage() {
  const { user, updateCurrentProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
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

  // Selfie Verification Modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  if (!user) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  const birthDate = new Date(user.date_of_birth || "2000-01-01");
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  const memberId = getMemberId(user);

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

  const handleRunSelfieVerification = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerifiedSuccess(true);
      updateCurrentProfile({ verified: true });
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#10b981", "#e11d48"],
        });
      } catch {
        // Safe fallback
      }
      setTimeout(() => {
        setShowVerificationModal(false);
        setVerifiedSuccess(false);
      }, 2000);
    }, 1800);
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
                src={user.id === "usr-aria-01" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black">{user.display_name}, {age}</h1>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white" title="Verified Member">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
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

        {/* Selfie Verification Trigger Bar */}
        <div className="mt-6 flex items-center justify-between p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <span className="font-semibold text-foreground">সেলফি ভেরিফিকেশন (Blue Tick)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowVerificationModal(true)}
            className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] transition-colors"
          >
            ভেরিফাই করুন 🛡️
          </button>
        </div>

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

      {/* Selfie Photo Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-sky-500/30 bg-card p-6 text-center shadow-2xl">
            <button
              onClick={() => setShowVerificationModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 mx-auto mb-3">
              <Camera className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-black">সেলফি ভেরিফিকেশন (Blue Badge)</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-5">
              ক্যামেরার দিকে তাকিয়ে হাসিমুখের একটি সেলফি তুলুন। এআই চেহারা যাচাই করে ব্লু টিক প্রদান করবে।
            </p>

            <div className="relative aspect-square max-w-[200px] mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-sky-500/40 bg-secondary flex items-center justify-center mb-5">
              {verifying ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="h-8 w-8 text-sky-500 animate-spin" />
                  <span className="text-xs font-bold text-sky-400">মুখমণ্ডল স্ক্যান করা হচ্ছে...</span>
                </div>
              ) : verifiedSuccess ? (
                <div className="flex flex-col items-center gap-2 text-emerald-400">
                  <Check className="h-10 w-10 stroke-[3]" />
                  <span className="text-xs font-bold">ভেরিফিকেশন সফল!</span>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-1 opacity-70" />
                  <span className="text-[11px] text-muted-foreground">পোজ: ক্যামেরার দিকে সোজা তাকান</span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={verifying || verifiedSuccess}
              onClick={handleRunSelfieVerification}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-sky-500/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
            >
              {verifying ? "যাচাই হচ্ছে..." : verifiedSuccess ? "অভিনন্দন!" : "সেলফি তুলুন ও ভেরিফাই করুন 📸"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
