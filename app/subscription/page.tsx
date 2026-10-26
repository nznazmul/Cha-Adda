"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { 
  Sparkles, 
  Check, 
  Zap, 
  Coffee, 
  RotateCcw, 
  ShieldCheck, 
  X, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";

type SubscriptionTier = "plus" | "gold" | "platinum";
type PaymentMethod = "bkash" | "nagad" | "rocket" | "card";

interface MicroPack {
  id: string;
  name: string;
  bdtPrice: string;
  usdPrice: string;
  icon: typeof Zap;
  color: string;
  desc: string;
}

export default function SubscriptionPage() {
  const [currency, setCurrency] = useState<"bdt" | "usd">("bdt");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>("gold");
  const [upgradedNotice, setUpgradedNotice] = useState<string | null>(null);

  // Payment checkout modal state
  const [checkoutItem, setCheckoutItem] = useState<{
    title: string;
    price: string;
    type: "subscription" | "pack";
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");
  const [walletNumber, setWalletNumber] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [processing, setProcessing] = useState(false);

  const plans = [
    {
      id: "plus" as SubscriptionTier,
      name: "CHA ADDA Plus",
      badge: "জনপ্রিয় (Popular)",
      bdtPrice: "৳১৯৯ / মাস",
      usdPrice: "$2.99 / mo",
      description: "Supercharge your discovery with unlimited likes and rewinds.",
      features: [
        "আনলিমিটেড লাইক ও সোয়াইপ (Unlimited Likes)",
        "ভুল সোয়াইপ রিওয়াইন্ড করার সুযোগ (Rewind)",
        "যেকোনো শহরের প্রোফাইল দেখার সুযোগ (Passport)",
        "কোনো বিজ্ঞাপন নেই (Zero Ads)",
      ],
      highlight: false,
      cta: "Choose Plus",
    },
    {
      id: "gold" as SubscriptionTier,
      name: "CHA ADDA Gold",
      badge: "সেরা পছন্দ (Best Value)",
      bdtPrice: "৳৪৯৯ / মাস",
      usdPrice: "$6.99 / mo",
      description: "See who liked you first and match with priority visibility.",
      features: [
        "CHA ADDA Plus-এর সকল সুবিধা",
        "সোয়াইপ করার আগেই দেখুন কে আপনাকে লাইক করেছে",
        "প্রতি সপ্তাহে ৫টি ফ্রি চা খাওয়ার দাওয়াত (Tea Invites)",
        "প্রতি মাসে ১টি ফ্রি প্রোফাইল বুস্ট (Free Boost)",
        "অ্যাডভান্সড ভেরিফিকেশন ও নিরাপত্তা ফিল্টার",
      ],
      highlight: true,
      cta: "Upgrade to Gold",
    },
    {
      id: "platinum" as SubscriptionTier,
      name: "CHA ADDA Platinum",
      badge: "ভিআইপি এলিট (VIP Elite)",
      bdtPrice: "৳৯৯৯ / মাস",
      usdPrice: "$12.99 / mo",
      description: "The ultimate edge with prioritized likes and pre-match messaging.",
      features: [
        "CHA ADDA Gold-এর সকল সুবিধা",
        "প্রায়োরিটি লাইক (টপ প্রোফাইলরা আপনাকে আগে দেখবে)",
        "সোয়াইপ করার আগেই ব্যক্তিগত চিঠি/নোট পাঠানোর সুবিধা",
        "মেসেজ রিড রিসিট (Seen checkmark)",
        "২৪/৭ ডেডিকেটেড ভিআইপি সাপোর্ট",
      ],
      highlight: false,
      cta: "Get Platinum",
    },
  ];

  const microPacks: MicroPack[] = [
    {
      id: "pack-boost",
      name: "৩০ মিনিটের প্রোফাইল বুস্ট",
      bdtPrice: "৳৪৯",
      usdPrice: "$0.79",
      icon: Zap,
      color: "from-amber-500 to-rose-500",
      desc: "আপনার এলাকায় আপনার প্রোফাইলকে সবার উপরে দেখান (১০ গুণ বেশি সোয়াইপ)",
    },
    {
      id: "pack-tea",
      name: "৫টি চা খাওয়ার দাওয়াত প্যাক",
      bdtPrice: "৳৯৯",
      usdPrice: "$1.49",
      icon: Coffee,
      color: "from-amber-500 to-amber-600",
      desc: "সরাসরি ব্যক্তিগত নোটসহ পছন্দের মানুষকে চায়ের আমন্ত্রণ পাঠান",
    },
    {
      id: "pack-rewind",
      name: "আনলিমিটেড রিওয়াইন্ড প্যাক",
      bdtPrice: "৳২৯",
      usdPrice: "$0.49",
      icon: RotateCcw,
      color: "from-sky-500 to-indigo-500",
      desc: "ভুলবশত বামে সোয়াইপ করা প্রোফাইল ফেরত আনুন যেকোনো সময়",
    },
  ];

  const handleOpenCheckout = (title: string, price: string, type: "subscription" | "pack") => {
    setCheckoutItem({ title, price, type });
    setOtpStep(false);
    setWalletNumber("");
    setOtpCode("");
  };

  const handleProceedOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletNumber) return;
    setOtpStep(true);
  };

  const handleConfirmPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const title = checkoutItem?.title || "Premium Package";
      setCheckoutItem(null);
      setUpgradedNotice(`সফল হয়েছে! "${title}" প্যাকেজ সক্রিয় হয়েছে।`);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#d12053", "#ea580c", "#8b5cf6", "#10b981"],
        });
      } catch {
        // Safe fallback
      }

      setTimeout(() => setUpgradedNotice(null), 5000);
    }, 1200);
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>প্রিমিয়াম মেম্বারশিপ ও প্যাক</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          খুঁজে নিন আপনার মনের মানুষকে, সহজে
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Unlock exclusive discovery powers, see who likes you before swiping, and stand out from the crowd.
        </p>

        {/* Currency Toggle */}
        <div className="mt-5 inline-flex items-center p-1 rounded-2xl border border-border bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setCurrency("bdt")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currency === "bdt"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🇧🇩 BDT (টাকা ৳)
          </button>
          <button
            type="button"
            onClick={() => setCurrency("usd")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currency === "usd"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌐 USD ($)
          </button>
        </div>

        {upgradedNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{upgradedNotice}</span>
          </div>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const displayPrice = currency === "bdt" ? plan.bdtPrice : plan.usdPrice;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary border-primary shadow-xl"
                  : plan.highlight
                  ? "border-amber-500 bg-card shadow-2xl ring-2 ring-amber-500/30 md:scale-105"
                  : "border-border bg-card/60 hover:border-primary/50"
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-md ${
                    plan.highlight
                      ? "bg-gradient-to-r from-amber-500 to-rose-500"
                      : "bg-secondary-foreground text-secondary"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="text-xl font-black">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    {displayPrice}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>

                <div className="my-6 border-t border-border" />

                <ul className="space-y-3 text-xs">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-normal">
                      <div className="flex h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCheckout(plan.name, displayPrice, "subscription");
                }}
                className={`mt-8 w-full py-3.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-98 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-white shadow-rose-500/25 hover:opacity-95"
                    : "bg-primary text-white hover:opacity-90"
                }`}
              >
                {currency === "bdt" ? "বিকাশ / নগদে কিনুন" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Microtransactions Section (ছোট প্যাকেজ) */}
      <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-md">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
            তাৎক্ষণিক সুবিধা (Instant Add-ons)
          </span>
          <h2 className="text-2xl font-black">ছোট প্যাকেজ ও বুস্ট (Micro-Packs)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            সাবস্ক্রিপশন ছাড়াই প্রয়োজন অনুযায়ী দ্রুত বুস্ট বা চা খাওয়ার দাওয়াত প্যাক কিনুন।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {microPacks.map((pack) => {
            const Icon = pack.icon;
            const price = currency === "bdt" ? pack.bdtPrice : pack.usdPrice;

            return (
              <div
                key={pack.id}
                className="rounded-2xl border border-border p-5 bg-background/60 hover:bg-secondary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${pack.color} text-white flex items-center justify-center shadow-md mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{pack.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {pack.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-lg font-black text-foreground">{price}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout(pack.name, price, "pack")}
                    className="px-3.5 py-1.5 rounded-full bg-secondary text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all"
                  >
                    কিনুন ⚡
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout Modal with bKash, Nagad, Rocket */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setCheckoutItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="mb-5">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                নিরাপদ পেমেন্ট (Secure Checkout)
              </span>
              <h3 className="text-lg font-black mt-0.5">{checkoutItem.title}</h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-500">{checkoutItem.price}</span>
                <span className="text-xs text-muted-foreground">তাত্ক্ষণিক অ্যাক্টিভেশন</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-muted-foreground block mb-2">
                পেমেন্ট মেথড নির্বাচন করুন
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "bkash"
                      ? "border-[#d12053] bg-[#d12053]/10 ring-2 ring-[#d12053]/30"
                      : "border-border bg-secondary/30 hover:bg-secondary"
                  }`}
                >
                  <span className="font-black text-xs text-[#d12053]">bKash</span>
                  <span className="text-[9px] text-muted-foreground">বিকাশ ওয়ালেট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("nagad")}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "nagad"
                      ? "border-[#ea580c] bg-[#ea580c]/10 ring-2 ring-[#ea580c]/30"
                      : "border-border bg-secondary/30 hover:bg-secondary"
                  }`}
                >
                  <span className="font-black text-xs text-[#ea580c]">Nagad</span>
                  <span className="text-[9px] text-muted-foreground">নগদ ওয়ালেট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("rocket")}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "rocket"
                      ? "border-[#8b5cf6] bg-[#8b5cf6]/10 ring-2 ring-[#8b5cf6]/30"
                      : "border-border bg-secondary/30 hover:bg-secondary"
                  }`}
                >
                  <span className="font-black text-xs text-[#8b5cf6]">Rocket</span>
                  <span className="text-[9px] text-muted-foreground">রকেট ওয়ালেট</span>
                </button>
              </div>
            </div>

            {/* Form Flow */}
            {!otpStep ? (
              <form onSubmit={handleProceedOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    আপনার {paymentMethod.toUpperCase()} অ্যাকাউন্ট নম্বর দিন
                  </label>
                  <input
                    type="tel"
                    required
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    আপনার নম্বরে একটি ৪ সংখ্যার ওটিপি (OTP) পাঠানো হবে।
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!walletNumber}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>এগিয়ে যান (Proceed to OTP)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-secondary/60 text-xs">
                  <span className="text-muted-foreground">নম্বর: </span>
                  <strong className="text-foreground">{walletNumber}</strong>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    টেস্টিং কোড: যেকোনো ৪ ডিজিট টাইপ করুন (যেমন: 1234)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    ৪ সংখ্যার ওটিপি (OTP) ও পিন কোড দিন
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="• • • •"
                    className="w-full text-center tracking-widest text-lg font-bold rounded-2xl border border-border bg-background p-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="flex-1 py-3 rounded-2xl border border-border text-xs font-semibold hover:bg-secondary"
                  >
                    পেছনে যান
                  </button>
                  <button
                    type="button"
                    disabled={otpCode.length < 4 || processing}
                    onClick={handleConfirmPayment}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {processing ? (
                      <span>যাচাই হচ্ছে...</span>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>পেমেন্ট নিশ্চিত করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
