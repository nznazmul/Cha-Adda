"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Check, Heart, Flame, Shield, ArrowRight, Zap, Eye, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"plus" | "gold" | "platinum">("gold");
  const [upgradedNotice, setUpgradedNotice] = useState(false);

  const handleSimulatedUpgrade = () => {
    setUpgradedNotice(true);
    setTimeout(() => setUpgradedNotice(false), 3000);
  };

  const plans = [
    {
      id: "plus",
      name: "CHA ADDA Plus",
      badge: "Popular",
      price: "$9.99 / mo",
      description: "Supercharge your discovery with unlimited likes and rewinds.",
      features: [
        "Unlimited Likes every day",
        "Rewind your last swipe",
        "Control who sees your profile",
        "Browse profiles globally",
        "Ad-free clean experience",
      ],
      cta: "Choose Plus",
      highlight: false,
    },
    {
      id: "gold",
      name: "CHA ADDA Gold",
      badge: "Best Value",
      price: "$19.99 / mo",
      description: "See everyone who liked you and match with them instantly.",
      features: [
        "Everything in Plus",
        "See Who Likes You grid unblurred",
        "5 Super Likes every week",
        "1 Free Monthly Boost for 30 minutes",
        "Priority customer support",
      ],
      cta: "Choose Gold",
      highlight: true,
    },
    {
      id: "platinum",
      name: "CHA ADDA Platinum",
      badge: "Elite",
      price: "$29.99 / mo",
      description: "The ultimate VIP experience with maximum visibility and priority.",
      features: [
        "Everything in Gold",
        "Priority Likes — be seen first",
        "Attach a note before matching",
        "Advanced lifestyle & verified filters",
        "Exclusive VIP profile badge",
      ],
      cta: "Choose Platinum",
      highlight: false,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Optional Premium Upgrades</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          Find your match <span className="gradient-text-primary">faster.</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          Core dating, matching, and messaging are always 100% free. Unlock premium features for enhanced visibility and instant admirer access.
        </p>
      </div>

      {upgradedNotice && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs sm:text-sm text-emerald-400 font-bold max-w-md mx-auto">
          🎉 Congratulations! Your account has been upgraded to {selectedPlan.toUpperCase()} (Simulated Test Mode).
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as any)}
              className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all ${
                plan.highlight
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
                    setSelectedPlan(plan.id as any);
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
          You don't need to pay a single penny to find love. Browsing, swiping, mutual matching, and real-time chat are completely free forever.
        </p>
      </div>
    </div>
  );
}
