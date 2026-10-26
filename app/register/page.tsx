"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, ArrowRight, Check, User, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-context";
import { validateAndFormatPhone } from "@/lib/utils/phone";

const COUNTRY_CODES = [
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+880");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password strength check
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordStrong = hasMinLength && hasNumber && hasSpecial;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneResult = validateAndFormatPhone(phone, countryCode);
    if (!phoneResult.isValid) {
      setError(phoneResult.error || "সঠিক মোবাইল নম্বর দিন।");
      return;
    }

    if (!isAdult) {
      setError("You must be at least 18 years old to join CHA ADDA.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPasswordStrong) {
      setError("Please choose a stronger password (at least 8 characters with a number).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, phone, countryCode }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        setError(resData.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Immediately sign in so the user has an active session and cookies
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.warn("Immediate sign-in warning:", signInError);
      }

      await refreshAuth();
      router.refresh();
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/10 to-amber-500/10 border border-rose-500/20 p-2 shadow-lg shadow-rose-500/10 mb-4 overflow-hidden">
            <Image
              src="/logo-icon.png"
              alt="CHA ADDA Logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Create your account</h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Join the verified 18+ dating community.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Full Name / Display Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Tanvir"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>
                Mobile Number <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {countryCode === "+880" ? "১১ ডিজিট (যেমন 017...)" : "Country code + number"}
              </span>
            </label>
            <div className="flex gap-2">
              {/* Country Code Picker */}
              <div className="relative w-36 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full h-[42px] appearance-none rounded-xl border border-border bg-background py-2 pl-3 pr-7 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-background text-foreground">
                      {c.flag} {c.code} ({c.name})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground text-[10px]">
                  ▼
                </div>
              </div>

              {/* Phone Input */}
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={countryCode === "+880" ? "01712345678" : "Phone number"}
                  className="w-full h-[42px] rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {countryCode === "+880"
                ? "বাংলাদেশী নম্বর (১১ ডিজিট, 013-019 সিরিজ)"
                : "Enter your active international mobile number"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Password Requirement Indicators */}
            {password && (
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-500 font-semibold" : ""}`}>
                  <Check className="h-3 w-3" /> 8+ chars
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-500 font-semibold" : ""}`}>
                  <Check className="h-3 w-3" /> 1+ number
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Adult 18+ Affirmation */}
          <div className="space-y-2 pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-xs text-foreground font-medium">
                I certify that I am at least 18 years old. Adult dating only.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-xs text-muted-foreground">
                I accept the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and acknowledge the{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Continue to Profile Setup"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
