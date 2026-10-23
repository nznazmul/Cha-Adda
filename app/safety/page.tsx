import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, AlertTriangle, Eye, PhoneCall, Flag, Heart } from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Dating Safety & Guidance</h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          Your physical and emotional safety is our highest priority. Review our safety best practices for online messaging and meeting in person.
        </p>
      </div>

      <div className="space-y-8">
        {/* Pillar 1: Online Safety */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Online Communication</h2>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong>Never send money or share financial information:</strong> Never wire funds, share bank details, or send cryptocurrency to anyone you meet online, regardless of their claimed emergency.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong>Keep personal details private:</strong> Do not share your home address, social security number, exact workplace, or credit information until you have established mutual trust in person.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>
                <strong>Stay on CHA ADDA platform initially:</strong> Our chat monitoring, safety filters, and reporting mechanisms work when conversations remain on the platform.
              </span>
            </li>
          </ul>
        </section>

        {/* Pillar 2: In-Person Meetups */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Meeting In Person</h2>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>
                <strong>Meet in a public, populated place:</strong> Always arrange your first several dates in busy public spaces such as cafes, restaurants, or cultural venues. Never meet in a secluded location or private residence.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>
                <strong>Tell a trusted friend or family member:</strong> Share details of where you are going, who you are meeting, and when you plan to return.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>
                <strong>Control your own transportation:</strong> Arrive and leave using your own vehicle, rideshare, or public transit so you can exit the date at any moment.
              </span>
            </li>
          </ul>
        </section>

        {/* Pillar 3: Zero Tolerance Reporting */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Flag className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-bold">Reporting Violations</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            We enforce a zero-tolerance policy against harassment, impersonation, unsolicited explicit imagery, and underage accounts. Use the report button available on every profile and conversation, or contact our trust and safety team immediately.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/community-guidelines"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <span>Read Community Guidelines</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
