"use client";

import React, { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { submitReport } from "@/lib/services/safety-service";
import { ReportCategory } from "@/types/database";

const REPORT_CATEGORIES: { id: ReportCategory; label: string; description: string }[] = [
  { id: "harassment", label: "Harassment or Bullying", description: "Unwanted aggressive messages or stalking." },
  { id: "inappropriate_photos", label: "Inappropriate / Explicit Photos", description: "Nudity, sexually explicit, or violent imagery." },
  { id: "fake_profile", label: "Fake Profile / Impersonation", description: "Using someone else's pictures or misleading identity." },
  { id: "spam_scam", label: "Spam or Financial Scam", description: "Commercial solicitation, links, or requesting money." },
  { id: "underage", label: "Underage Member (Under 18)", description: "This dating platform is strictly 18+ only." },
  { id: "threats", label: "Physical Threats / Harm", description: "Threatening violence or illegal behavior." },
  { id: "other", label: "Other Policy Violation", description: "Other conduct violating our community guidelines." },
];

function ReportFormContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const reportedUserId = params.userId as string;
  const messageId = searchParams?.get("msg") || undefined;

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("harassment");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to file a report.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitReport({
        reporterId: user.id,
        reportedUserId,
        category: selectedCategory,
        description,
        messageId,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Report Member</h1>
          <p className="text-xs text-muted-foreground">
            Confidential report reviewed by our Trust & Safety moderation team.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Report Received</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Thank you for keeping CHA ADDA safe. Our moderators will review this case and the user will not know who reported them.
            </p>
            <div className="pt-4">
              <button
                onClick={() => router.push("/discover")}
                className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold"
              >
                Return to Discovery
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-3">
                Reason for Report
              </label>
              <div className="space-y-2">
                {REPORT_CATEGORIES.map((cat) => {
                  const selected = selectedCategory === cat.id;
                  return (
                    <label
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selected
                          ? "border-rose-500 bg-rose-500/10 shadow-sm"
                          : "border-border bg-background hover:bg-secondary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportCategory"
                        checked={selected}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="mt-0.5 accent-rose-500"
                      />
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${selected ? "text-rose-500" : "text-foreground"}`}>
                          {cat.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {cat.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any relevant context that will help our moderation team investigate..."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive text-white text-xs font-bold shadow-md shadow-destructive/25 hover:opacity-95 transition-all disabled:opacity-50"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{submitting ? "Submitting Report..." : "Submit Confidential Report"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MemberReportPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-muted-foreground">Loading report form...</div>}>
      <ReportFormContent />
    </Suspense>
  );
}
