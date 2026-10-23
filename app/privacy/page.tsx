import React from "react";
import Link from "next/link";
import { Lock, Shield, EyeOff, Database } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          How CHA ADDA protects your personal information, dating privacy, and identity.
        </p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
          <p>
            When registering and completing your dating profile, we collect your display name, birth date (held privately to verify 18+ adult age), gender, dating preferences, biography, interests, and profile photographs.
          </p>
          <p>
            We <strong>never</strong> publicly disclose your exact date of birth or email address to other users. Only your calculated age and display name are shown.
          </p>
        </section>

        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Geolocation & Distance Anonymity</h2>
          <p>
            If you enable location-based matching, we calculate approximate distances between users. We <strong>never</strong> expose exact latitude, longitude, or physical addresses to other members. You can disable location discovery at any time in your Settings.
          </p>
        </section>

        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. Private Messaging</h2>
          <p>
            Chat messages are strictly restricted to the two participants of an active, mutual match. Messages are secured via database-level Row Level Security (RLS) policies. Unmatched or blocked users cannot read or send messages.
          </p>
        </section>

        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. Account Deletion & Data Rights</h2>
          <p>
            You retain full control over your data. You may request immediate profile hiding, data export, or permanent deletion directly from your Account Settings. Upon deletion, your profile disappears from discovery immediately.
          </p>
        </section>
      </div>
    </div>
  );
}
