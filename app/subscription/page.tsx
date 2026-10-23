"use client";

import React, { useState } from "react";
import { Sparkles, Check } from "lucide-react";

type SubscriptionTier = "plus" | "gold" | "platinum";

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>("gold");
  const [upgradedNotice, setUpgradedNotice] = useState(false);

  const handleSimulatedUpgrade = () => {
    setUpgradedNotice(true);
    setTimeout(() => setUpgradedNotice(false), 3000);
  };

  const plans: Array<{
    id: SubscriptionTier;
    name: string;
    badge?: string;
    price: string;
    description: string;
    features: string[];
    highlight: boolean;
    cta: string;
  }> = [
    {
      id: "plus",
      name: "CHA ADDA Plus",
      badge: "Popular",
      price: "$9.99 / mo",
      description: "Supercharge your discovery with unlimited likes and rewinds.",
      features: [
        "Unlimited Likes & Swipes",
        "Rewind your last swipe anytime",
        "Passport to any location worldwide",
        "Hide advertisements",
      ],
      highlight: false,
      cta: "Choose Plus",
    },
    {
      id: "gold",
      name: "CHA ADDA Gold",
      badge: "Best Value",
      price: "$19.99 / mo",
      description: "See who liked you first and match with priority visibility.",
      features: [
        "All features of CHA ADDA Plus",
        "See who liked you before swiping",
        "5 Free Superlikes every week",
        "1 Free Profile Boost per month",
        "Advanced safety & verification filters",
      ],
      highlight: true,
      cta: "Upgrade to Gold",
    },
    {
      id: "platinum",
      name: "CHA ADDA Platinum",
      badge: "VIP Elite",
      price: "$29.99 / mo",
      description: "The ultimate edge with prioritized likes and pre-match messaging.",
      features: [
        "All features of CHA ADDA Gold",
        "Priority Likes (seen faster by top profiles)",
        "Attach a personal note before matching",
        "Read receipts on direct messages",
        "VIP dedicated support",
      ],
      highlight: false,
      cta: "Get Platinum",
    },
  ];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Premium Memberships</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Find Your Person, Faster
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Unlock exclusive discovery powers, see who likes you before swiping, and stand out from the crowd.
        </p>

        {upgradedNotice && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
            ✓ Simulated tier activated! In production, this connects to Stripe.
          </div>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary border-primary shadow-xl"
                  : plan.highlight
                  ? "border-amber-500 bg-card shadow-2xl ring-2 ring-amber-500/30 md:scale-105"
                  : "border-border/80 bg-card/60 hover:border-primary/50"
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    plan.highlight
                      ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="text-xl font-extrabold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.description}</p>
                <div className="my-6">
                  <span className="text-3xl font-black">{plan.price}</span>
                </div>

                <ul className="space-y-3 text-xs text-foreground/90">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? "text-amber-500" : "text-primary"}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 mt-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                    handleSimulatedUpgrade();
                  }}
                  className={`w-full py-3 rounded-full text-xs font-bold transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/25 hover:opacity-95"
                      : "bg-secondary hover:bg-primary hover:text-white text-foreground"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Plan Assurance */}
      <div className="mt-16 text-center max-w-xl mx-auto rounded-3xl border border-border/80 bg-card/40 p-6">
        <h4 className="text-sm font-bold text-foreground">Always Free for Everyone</h4>
        <p className="text-xs text-muted-foreground mt-1">
          You don&apos;t need to pay a single penny to find love. Browsing, swiping, mutual matching, and real-time chat are completely free forever.
        </p>
      </div>
    </div>
  );
}
