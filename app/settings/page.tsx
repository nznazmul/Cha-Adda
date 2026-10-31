"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  Bell,
  Lock,
  Trash2,
  LogOut,
  SlidersHorizontal,
  ArrowLeft,
  Sparkles,
  Shield,
  ChevronRight,
  MapPin,
  LocateFixed,
  Users,
  Compass,
  Check,
  Heart
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/providers/auth-context";
import { fetchUserPreferences, saveUserPreferences } from "@/lib/services/preferences-service";
import { BANGLADESH_CITIES, findNearestCity, calculateDistanceBetween } from "@/lib/services/geo-service";
import { devStore } from "@/lib/services/dev-store";

const DISTANCE_PRESETS = [
  { label: "১০ কিমি", value: 10, hint: "কাছের আড্ডা (Neighborhood)" },
  { label: "২৫ কিমি", value: 25, hint: "পুরো মেট্রো শহর (City)" },
  { label: "৫০ কিমি", value: 50, hint: "আশেপাশের এলাকা (Greater Metro)" },
  { label: "১০০ কিমি", value: 100, hint: "পার্শ্ববর্তী জেলা (Nearby Districts)" },
  { label: "পুরো বাংলাদেশ", value: 300, hint: "সারাদেশের মানুষ (All Bangladesh)" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, updateCurrentProfile } = useAuth();
  const [, startTransition] = useTransition();

  const [notificationsMatches, setNotificationsMatches] = useState(true);
  const [notificationsMessages, setNotificationsMessages] = useState(true);
  const [notificationsLikes, setNotificationsLikes] = useState(true);
  const [isDiscoverable, setIsDiscoverable] = useState(user?.is_discoverable ?? true);
  const [showDistance, setShowDistance] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Distance & Location State
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [selectedCity, setSelectedCity] = useState<string>(user?.city || "Dhaka");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyCount, setNearbyCount] = useState<number>(0);

  // Ideal Match Preferences State (Age & Gender)
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(45);
  const [preferredGenders, setPreferredGenders] = useState<string[]>(["woman"]);

  // Load preferences from database / local store
  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      fetchUserPreferences(user.id).then((prefs) => {
        if (!isMounted) return;
        setMaxDistance(prefs.max_distance_km || 50);
        setShowDistance(prefs.show_distance !== false);
        setMinAge(prefs.min_age || 18);
        setMaxAge(prefs.max_age || 45);
        setPreferredGenders(prefs.preferred_genders || ["woman"]);
      });
    }
    if (user?.city) {
      setSelectedCity(user.city);
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.city]);

  // Compute how many candidates are within the selected distance radius
  useEffect(() => {
    if (!user) return;
    const allCandidates = devStore.getDiscoveryCandidates(user.id, 999);
    const count = allCandidates.filter((c) => {
      if (maxDistance >= 300) return true;
      const d = calculateDistanceBetween(
        { id: user.id, city: selectedCity },
        { id: c.id, city: c.city }
      );
      return d <= maxDistance;
    }).length;
    setNearbyCount(count);
  }, [user, maxDistance, selectedCity]);

  const showNotification = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleDistanceChange = async (newDistance: number) => {
    setMaxDistance(newDistance);
    if (user?.id) {
      await saveUserPreferences(user.id, {
        max_distance_km: newDistance,
      });
      showNotification(`দূরত্ব ফিল্টার ${newDistance >= 300 ? "পুরো বাংলাদেশ" : `${newDistance} কিমি`} নির্ধারণ করা হয়েছে!`);
    }
  };

  const handleAgeChange = async (newMin: number, newMax: number) => {
    const validMin = Math.min(newMin, newMax);
    const validMax = Math.max(newMin, newMax);
    setMinAge(validMin);
    setMaxAge(validMax);
    if (user?.id) {
      await saveUserPreferences(user.id, {
        min_age: validMin,
        max_age: validMax,
      });
      showNotification(`পছন্দের বয়সের পরিধি ${validMin} - ${validMax} বছর নির্ধারণ করা হয়েছে!`);
    }
  };

  const handleGenderToggle = async (targetGender: string) => {
    let nextGenders: string[];
    if (targetGender === "all") {
      nextGenders = ["woman", "man", "nonbinary"];
    } else {
      if (preferredGenders.length === 3) {
        nextGenders = [targetGender];
      } else if (preferredGenders.includes(targetGender)) {
        if (preferredGenders.length > 1) {
          nextGenders = preferredGenders.filter((g) => g !== targetGender);
        } else {
          nextGenders = ["woman", "man", "nonbinary"];
        }
      } else {
        nextGenders = [...preferredGenders, targetGender];
      }
    }
    setPreferredGenders(nextGenders);
    if (user?.id) {
      await saveUserPreferences(user.id, {
        preferred_genders: nextGenders,
      });
      showNotification("লিঙ্গ পছন্দ সফলভাবে সংরক্ষিত হয়েছে!");
    }
  };

  const handleSavePreferences = async (overrides?: { isDiscoverable?: boolean; showDistance?: boolean }) => {
    if (!user?.id) return;
    const discoverable = overrides?.isDiscoverable ?? isDiscoverable;
    const distVisible = overrides?.showDistance ?? showDistance;

    await updateCurrentProfile({
      is_discoverable: discoverable,
      city: selectedCity,
    });

    await saveUserPreferences(user.id, {
      max_distance_km: maxDistance,
      show_distance: distVisible,
      min_age: minAge,
      max_age: maxAge,
      preferred_genders: preferredGenders,
    });

    showNotification("সেটিংস সফলভাবে আপডেট করা হয়েছে!");
  };

  // Browser GPS auto-detection
  const handleDetectLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("আপনার ব্রাউজারে GPS সাপোর্ট পাওয়া যায়নি। নিচের তালিকা থেকে শহর নির্বাচন করুন।");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestCity(latitude, longitude);
        setSelectedCity(nearest.nameEn);

        if (user?.id) {
          await updateCurrentProfile({
            city: nearest.nameEn,
            latitude,
            longitude,
          });
        }
        setIsDetectingLocation(false);
        showNotification(`লোকেশন আপডেট হয়েছে: ${nearest.nameBn} (${nearest.nameEn}) 📍`);
      },
      (err) => {
        setIsDetectingLocation(false);
        console.warn("Geolocation error:", err);
        setLocationError("GPS পারমিশন পাওয়া যায়নি। আপনি নিচের ড্রপডাউন থেকে আপনার শহর নির্বাচন করতে পারেন।");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCitySelect = async (newCity: string) => {
    setSelectedCity(newCity);
    if (user?.id) {
      await updateCurrentProfile({ city: newCity });
      showNotification(`শহর পরিবর্তন করা হয়েছে: ${newCity}`);
    }
  };

  const handleDeleteAccount = () => {
    if (user) {
      updateCurrentProfile({
        account_status: "suspended",
        is_discoverable: false,
      });
      signOut();
      router.push("/");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to Profile"
          title="Back to Profile"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            লোকেশন ফিল্টার, দূরত্ব এবং অ্যাকাউন্টের গোপনীয়তা নিয়ন্ত্রণ করুন।
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-semibold text-center animate-in fade-in flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* FEATURE 2: Distance & Location Radius Filter */}
      <section className="rounded-3xl border border-rose-500/30 bg-card p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-1.5">
                <span>দূরত্ব ও লোকেশন ফিল্টার (Distance Radius)</span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                আপনি কত কিলোমিটার দূরত্বের মধ্যকার মানুষকে আপনার ফীডে দেখতে চান তা সেট করুন।
              </p>
            </div>
          </div>
          <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-black text-rose-500 font-mono">
            {maxDistance >= 300 ? "সারাদেশ (300+ km)" : `${maxDistance} km`}
          </span>
        </div>

        {/* Real-time Nearby Member Counter Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/60 border border-border/80 text-xs">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-foreground/90 font-medium">
              নির্বাচিত দূরত্বের মধ্যে সক্রিয় মেম্বার:
            </span>
          </div>
          <span className="font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
            {nearbyCount > 0 ? `~${nearbyCount} জন মানুষ` : "০ জন (দূরত্ব বাড়ান)"}
          </span>
        </div>

        {/* Distance Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">সর্বোচ্চ দূরত্ব (Maximum Distance)</span>
            <span className="font-bold text-foreground">
              {maxDistance >= 300 ? "পুরো বাংলাদেশ (All Bangladesh)" : `${maxDistance} কিলোমিটারের মধ্যে`}
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={maxDistance}
            onChange={(e) => handleDistanceChange(Number(e.target.value))}
            className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-rose-500"
          />

          <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-0.5">
            <span>৫ কিমি</span>
            <span>৫০ কিমি</span>
            <span>১০০ কিমি</span>
            <span>২০০ কিমি</span>
            <span>৩০০+ কিমি (সারাদেশ)</span>
          </div>
        </div>

        {/* Quick Distance Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            দ্রুত নির্বাচন (Quick Presets):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DISTANCE_PRESETS.map((p) => {
              const isSelected = maxDistance === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleDistanceChange(p.value)}
                  className={`flex flex-col items-start p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-rose-500 bg-rose-500/10 text-rose-500 shadow-sm"
                      : "border-border/80 bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    {p.label}
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="text-[10px] opacity-75 mt-0.5 truncate w-full">
                    {p.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Location & GPS Detection */}
        <div className="pt-3 border-t border-border/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                <span>আপনার বর্তমান অবস্থান (Your Location)</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                এই লোকেশনকে কেন্দ্র করে আপনার আশেপাশের মানুষদের দূরত্বের হিসেব বের করা হবে।
              </p>
            </div>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
            >
              <LocateFixed className={`h-3.5 w-3.5 ${isDetectingLocation ? "animate-spin" : ""}`} />
              <span>{isDetectingLocation ? "GPS খোঁজা হচ্ছে..." : "GPS দিয়ে লোকেশন ডিটেক্ট"}</span>
            </button>
          </div>

          {locationError && (
            <p className="text-[11px] text-destructive bg-destructive/10 p-2 rounded-xl border border-destructive/20">
              {locationError}
            </p>
          )}

          {/* City Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
              শহর বা জেলা নির্বাচন করুন:
            </label>
            <select
              value={selectedCity}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm font-medium focus:border-primary focus:outline-none"
            >
              <option value="Dhaka">ঢাকা (Dhaka)</option>
              <option value="Chittagong">চট্টগ্রাম (Chittagong)</option>
              <option value="Sylhet">সিলেট (Sylhet)</option>
              <option value="Rajshahi">রাজশাহী (Rajshahi)</option>
              <option value="Khulna">খুলনা (Khulna)</option>
              <option value="Barisal">বরিশাল (Barisal)</option>
              <option value="Rangpur">রংপুর (Rangpur)</option>
              <option value="Mymensingh">ময়মনসিংহ (Mymensingh)</option>
              <option value="Comilla">কুমিল্লা (Comilla)</option>
              <option value="Gazipur">গাজীপুর (Gazipur)</option>
              <option value="Narayanganj">নারায়ণগঞ্জ (Narayanganj)</option>
              <option value="Savar">সাভার (Savar)</option>
              <option value="Cox's Bazar">কক্সবাজার (Cox&apos;s Bazar)</option>
              <option value="Tangail">টাঙ্গাইল (Tangail)</option>
              <option value="Bogura">বগুড়া (Bogura)</option>
              <option value="Jessore">যশোর (Jessore)</option>
              <option value="Bandarban">বান্দরবান (Bandarban)</option>
            </select>
          </div>
        </div>
      </section>

      {/* FEATURE: Ideal Match Preferences (Age & Gender) */}
      <section className="rounded-3xl border border-rose-500/30 bg-card p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 text-rose-500">
              <Heart className="h-5 w-5 fill-rose-500/30" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-1.5">
                <span>ম্যাচিং পছন্দসমূহ (Match Preferences)</span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                আপনি কাদের সাথে পরিচিত হতে চান — বয়স ও লিঙ্গ ফিল্টার করুন।
              </p>
            </div>
          </div>
          <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-black text-rose-500 font-mono">
            {minAge} - {maxAge} বছর
          </span>
        </div>

        {/* Interested In / Gender Matching */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-foreground block">
            কার সাথে পরিচিত হতে চান? (Interested In):
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "woman", label: "নারী (Women)", hint: "শুধুমাত্র নারীদের প্রোফাইল" },
              { id: "man", label: "পুরুষ (Men)", hint: "শুধুমাত্র পুরুষদের প্রোফাইল" },
              { id: "all", label: "সবাই (Everyone)", hint: "সকল মেম্বার" },
            ].map((g) => {
              const isAll = g.id === "all" && preferredGenders.length >= 2;
              const isSelected = isAll || (preferredGenders.length === 1 && preferredGenders.includes(g.id));
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGenderToggle(g.id)}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-rose-500 bg-rose-500/10 text-rose-500 shadow-sm"
                      : "border-border/80 bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    {g.label}
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="text-[10px] opacity-75 mt-0.5 truncate w-full">
                    {g.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Age Range Slider Controls */}
        <div className="space-y-4 pt-2 border-t border-border/80">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">পছন্দের বয়স সীমা (Age Range):</span>
            <span className="font-bold text-foreground">
              {minAge} বছর থেকে {maxAge} বছর
            </span>
          </div>

          {/* Min Age Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
              <span>নূন্যতম বয়স (Min Age):</span>
              <span className="font-mono font-bold text-foreground">{minAge} বছর</span>
            </div>
            <input
              type="range"
              min={18}
              max={65}
              step={1}
              value={minAge}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleAgeChange(val, Math.max(val, maxAge));
              }}
              className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Max Age Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
              <span>সর্বোচ্চ বয়স (Max Age):</span>
              <span className="font-mono font-bold text-foreground">{maxAge} বছর</span>
            </div>
            <input
              type="range"
              min={18}
              max={70}
              step={1}
              value={maxAge}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleAgeChange(Math.min(minAge, val), val);
              }}
              className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-0.5">
            <span>১৮ বছর</span>
            <span>২৫ বছর</span>
            <span>৩৫ বছর</span>
            <span>৫০ বছর</span>
            <span>৭০ বছর</span>
          </div>
        </div>
      </section>

      {/* Discovery & Visibility */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Discovery & Visibility</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold">Discoverable in Feed</p>
            <p className="text-xs text-muted-foreground">
              When disabled, your card is hidden from others&apos; discovery decks.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isDiscoverable}
            onChange={(e) => {
              const val = e.target.checked;
              setIsDiscoverable(val);
              handleSavePreferences({ isDiscoverable: val });
            }}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-semibold">Show Approximate Distance</p>
            <p className="text-xs text-muted-foreground">
              Display approximate distance (e.g. 3 km away) on your public card.
            </p>
          </div>
          <input
            type="checkbox"
            checked={showDistance}
            onChange={(e) => {
              const val = e.target.checked;
              setShowDistance(val);
              handleSavePreferences({ showDistance: val });
            }}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-semibold">Show Active Status</p>
            <p className="text-xs text-muted-foreground">
              Show when you are currently online or active.
            </p>
          </div>
          <input
            type="checkbox"
            checked={showOnline}
            onChange={(e) => setShowOnline(e.target.checked)}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
          />
        </div>
      </section>

      {/* Theme & Display */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span>Appearance</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Color Theme</p>
            <p className="text-xs text-muted-foreground">
              Switch between deep plum dark theme and warm light theme.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl border border-border bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors"
          >
            {theme === "dark" ? "Dark Mode (Active)" : "Light Mode (Active)"}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">New Matches</span>
            <input
              type="checkbox"
              checked={notificationsMatches}
              onChange={(e) => setNotificationsMatches(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm">New Chat Messages</span>
            <input
              type="checkbox"
              checked={notificationsMessages}
              onChange={(e) => setNotificationsMessages(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm">Admirer Likes (When upgraded)</span>
            <input
              type="checkbox"
              checked={notificationsLikes}
              onChange={(e) => setNotificationsLikes(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </div>
        </div>
      </section>

      {/* Membership & Safety Shortcuts */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Membership & Safety</span>
        </div>

        <div className="space-y-2 pt-1">
          <Link
            href="/subscription"
            className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-secondary/30 hover:bg-secondary/70 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">CHA ADDA Subscription & Packs</p>
                <p className="text-[11px] text-muted-foreground">Manage Plus, Gold, Platinum plans and Tea Invites</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/safety"
            className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-secondary/30 hover:bg-secondary/70 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Dating Safety Guide</p>
                <p className="text-[11px] text-muted-foreground">In-person safety tips, public venues, and guidance</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </div>
      </section>

      {/* Account Actions */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-destructive font-bold text-sm">
          <Lock className="h-4 w-4" />
          <span>Account & Security</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => signOut()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive hover:text-white transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-3xl border border-border bg-card p-6 text-center space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-destructive">Delete your account?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This action is permanent. Your dating profile, swipes, matches, and conversations will be deleted in accordance with our data retention policy.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-xs font-bold hover:opacity-90"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
