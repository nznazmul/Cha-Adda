"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  User, 
  Settings, 
  Sparkles, 
  Camera, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  ShieldCheck, 
  Heart,
  Plus,
  Trash2,
  Check,
  Edit3
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { calculateAge } from "@/lib/utils";

export default function ProfilePage() {
  const { user, updateCurrentProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [jobTitle, setJobTitle] = useState(user?.job_title || "");
  const [city, setCity] = useState(user?.city || "");
  const [savedNotice, setSavedNotice] = useState(false);

  if (!user) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Please sign in to view your profile.
      </div>
    );
  }

  const age = calculateAge(user.date_of_birth);

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
            <div className="relative h-24 w-24 rounded-3xl overflow-hidden border-4 border-card shadow-xl ring-2 ring-primary bg-secondary">
              <img
                src={user.id === "usr-aria-01" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black">{user.display_name}, {age}</h1>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.city} • {user.gender}
              </p>
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

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all"
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
    </div>
  );
}
