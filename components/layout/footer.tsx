"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, HeartHandshake, Lock, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-card/40 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-500/10 to-amber-500/10 border border-rose-500/20 p-0.5 overflow-hidden">
                <Image
                  src="/logo-icon.png"
                  alt="CHA ADDA Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-extrabold text-base tracking-tight gradient-text-primary">
                CHA ADDA
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center md:text-left">
              Meet. Swap. Connect. Real dates & meaningful connections. Strict 18+ verified community.
            </p>
          </div>

          {/* Legal and Safety Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
            <Link
              href="/safety"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Safety Guide</span>
            </Link>
            <Link
              href="/community-guidelines"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <HeartHandshake className="h-3.5 w-3.5 text-rose-500" />
              <span>Community Guidelines</span>
            </Link>
            <Link
              href="/privacy"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Privacy Policy</span>
            </Link>
            <Link
              href="/terms"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Terms of Service</span>
            </Link>
          </div>

          {/* Adult 18+ Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-500 border border-rose-500/20">
              18+ ONLY
            </span>
            <span className="text-[11px] text-muted-foreground">
              © 2026 CHA ADDA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
