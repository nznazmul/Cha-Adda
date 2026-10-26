"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  Flame, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Calendar, 
  Heart, 
  Sparkles, 
  Image as ImageIcon, 
  Sliders, 
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { calculateAge, cn } from "@/lib/utils";
import { devStore } from "@/lib/services/dev-store";
import { createClient } from "@/lib/supabase/client";

const INTEREST_OPTIONS = [
  "Music", "Travel", "Movies", "Gaming", "Fitness", "Food", 
  "Books", "Technology", "Photography", "Outdoor activities", 
  "Pets", "Art", "Sports", "Coffee & Chai", "Cooking", "Yoga", 
  "Concerts", "Design", "Nature", "Writing"
];

const INTENTION_OPTIONS = [
  "Long-term relationship",
  "Serious dating",
  "Casual dating",
  "Friendship",
  "Still figuring it out"
];

function OnboardingContent() {
  const router = useRouter();
  const { user, updateCurrentProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [dob, setDob] = useState(user?.date_of_birth || "2000-01-01");
  const [gender, setGender] = useState<"man" | "woman" | "nonbinary" | "other">(user?.gender || "woman");
  const [interestedIn, setInterestedIn] = useState<string[]>(["man"]);
  const [orientation, setOrientation] = useState(user?.orientation || "Straight");
  const [city, setCity] = useState(user?.city || "Dhaka");
  
  const [intentions, setIntentions] = useState<string[]>(user?.dating_intentions || ["Long-term relationship"]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || ["Coffee & Chai", "Music", "Travel"]);
  
  const [bio, setBio] = useState(user?.bio || "");
  const [jobTitle, setJobTitle] = useState(user?.job_title || "");
  const [education, setEducation] = useState(user?.education || "");
  const [heightCm, setHeightCm] = useState(user?.height_cm || 170);
  const [languages, setLanguages] = useState<string[]>(user?.languages || ["English", "Bengali"]);

  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
  ]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(35);
  const [maxDistance, setMaxDistance] = useState(30);
  const [isDiscoverable, setIsDiscoverable] = useState(true);

  // Validation per step
  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!displayName.trim()) {
        setError("Please enter your display name.");
        return false;
      }
      const age = calculateAge(dob);
      if (isNaN(age) || age < 18) {
        setError("You must be at least 18 years old to use CHA ADDA.");
        return false;
      }
      if (!city.trim()) {
        setError("Please enter your city.");
        return false;
      }
    }
    if (step === 2) {
      if (intentions.length === 0) {
        setError("Please select at least one dating intention.");
        return false;
      }
    }
    if (step === 3) {
      if (selectedInterests.length < 3) {
        setError("Please select at least 3 interests.");
        return false;
      }
    }
    if (step === 5) {
      if (photos.length === 0) {
        setError("Please add at least one photo for your profile.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleIntention = (item: string) => {
    setIntentions((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleInterestedIn = (item: string) => {
    setInterestedIn((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addPhoto = () => {
    if (newPhotoUrl.trim()) {
      setPhotos((prev) => [...prev, newPhotoUrl.trim()]);
      setNewPhotoUrl("");
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (!validateStep(currentStep)) return;
    setSaving(true);

    const profileData = {
      display_name: displayName,
      date_of_birth: dob,
      gender,
      orientation,
      city,
      dating_intentions: intentions,
      interests: selectedInterests,
      bio,
      job_title: jobTitle,
      education,
      height_cm: heightCm,
      languages,
      is_discoverable: isDiscoverable,
      profile_complete: true,
    };

    if (user?.id && photos.length > 0) {
      const formattedPhotos = photos.map((url, idx) => ({
        id: `ph-${user.id}-${idx + 1}`,
        user_id: user.id,
        storage_path: "",
        url,
        display_order: idx,
        is_primary: idx === 0,
        moderation_status: "approved" as const,
        created_at: new Date().toISOString(),
      }));
      devStore.savePhotos(user.id, formattedPhotos);

      try {
        const supabase = createClient();
        await supabase.from("profile_photos").upsert(formattedPhotos);
      } catch (err) {
        console.warn("Could not sync photos to Supabase during onboarding:", err);
      }
    }

    await updateCurrentProfile(profileData);
    setSaving(false);
    router.push("/discover");
  };

  const totalSteps = 6;
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Step Progress Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="text-primary font-bold">Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progressPercent)}% Completed</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl backdrop-blur-md">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Basic Information</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tell us about yourself. Your birthdate is kept strictly private.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What should people call you?"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Date of Birth (18+ Required)
                </label>
                <span className="text-xs font-bold text-primary">
                  Age: {calculateAge(dob) || "—"}
                </span>
              </div>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max="2008-12-31"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Stored privately. Other members only see your calculated age.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "woman", label: "Woman" },
                  { id: "man", label: "Man" },
                  { id: "nonbinary", label: "Nonbinary" },
                  { id: "other", label: "Other" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGender(item.id as "woman" | "man" | "nonbinary" | "other")}
                    aria-pressed={gender === item.id}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                      gender === item.id
                        ? "border-rose-500 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow-md shadow-rose-500/30 ring-2 ring-rose-500/40"
                        : "border-border/80 bg-background/80 hover:bg-secondary/40 text-foreground/80 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                I want to meet
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "woman", label: "Women" },
                  { id: "man", label: "Men" },
                  { id: "nonbinary", label: "Nonbinary" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterestedIn(item.id)}
                    aria-pressed={interestedIn.includes(item.id)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                      interestedIn.includes(item.id)
                        ? "border-rose-500 bg-rose-500/20 text-rose-400 font-bold ring-2 ring-rose-500/30 shadow-sm"
                        : "border-border/80 bg-background/80 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Current City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Dhaka, Chittagong, Sylhet"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Dating Intentions */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Dating Intentions</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select one or more relationship intentions so we can find compatible matches.
              </p>
            </div>

            <div className="space-y-2.5">
              {INTENTION_OPTIONS.map((intent) => {
                const selected = intentions.includes(intent);
                return (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => toggleIntention(intent)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all text-left",
                      selected
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background hover:border-border/80 text-foreground"
                    )}
                  >
                    <span>{intent}</span>
                    {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Interests */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Your Interests</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Pick at least 3 things you are passionate about (Selected: {selectedInterests.length}).
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-3.5 py-2 rounded-full border text-xs font-semibold transition-all flex items-center gap-1.5",
                      isSelected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-background hover:border-primary/50 text-foreground"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Profile Details */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Profile Details</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Share a few details that help start great conversations.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                About Me (Bio)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your passions, what a typical Sunday looks like, or your favorite chai spot..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
              />
              <span className="text-[11px] text-muted-foreground float-right">
                {bio.length}/500
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Job / Profession
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Education
                </label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. University of Dhaka"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Height
                </label>
                <span className="text-xs font-bold text-primary">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min={140}
                max={220}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        )}

        {/* STEP 5: Profile Photos */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Profile Photos</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Add clear, authentic photos. The first photo will be your primary discovery card.
              </p>
            </div>

            {/* Photo Grid Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border group bg-secondary"
                >
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Photo Input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Paste an image URL (e.g. Unsplash or avatar)..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={addPhoto}
                className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-white text-xs font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Discovery Preferences */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Discovery Preferences</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Fine-tune who you want to see in your discovery stack.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Preferred Age Range
                </label>
                <span className="text-xs font-bold text-primary">
                  {minAge} – {maxAge} years
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={minAge}
                  onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                  className="w-full accent-primary"
                />
                <input
                  type="range"
                  min={19}
                  max={70}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Maximum Distance
                </label>
                <span className="text-xs font-bold text-primary">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-secondary/30">
              <div>
                <p className="text-sm font-semibold">Show me on Discovery</p>
                <p className="text-xs text-muted-foreground">
                  When turned off, other members will not see your profile in their feed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isDiscoverable}
                onChange={(e) => setIsDiscoverable(e.target.checked)}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
              />
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 flex items-center justify-between pt-4 border-t border-border">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:opacity-95 transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-sm font-bold text-white shadow-lg shadow-rose-500/30 hover:scale-105 transition-all disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{saving ? "Saving Profile..." : "Complete & Start Swiping"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-muted-foreground">Loading onboarding wizard...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
