import React from "react";
import Link from "next/link";
import { FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          Terms governing your access to and use of the CHA ADDA matchmaking service.
        </p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. Eligibility (18+ Adult Requirement)</h2>
          <p>
            You must be at least eighteen (18) years of age to create an account or use CHA ADDA. By registering, you warrant that you are legally an adult and capable of entering into a binding contract. Accounts found to be created by minors are permanently terminated with immediate effect.
          </p>
        </section>

        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Member Conduct & Mutual Respect</h2>
          <p>
            You agree to treat all members with courtesy and dignity. Any form of harassment, hate speech, stalking, non-consensual sexual content, or fraudulent extortion violates these Terms and will result in immediate suspension, banning, and potential reporting to law enforcement authorities.
          </p>
        </section>

        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. Safety Disclaimers</h2>
          <p>
            CHA ADDA facilitates introductions between consenting adults. While we implement security, moderation tools, and verification workflows, you are solely responsible for your interactions with other members, both online and in person. Always follow our Dating Safety Guidance.
          </p>
        </section>
      </div>
    </div>
  );
}
