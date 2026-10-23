"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Flame, 
  Heart, 
  MessageCircle, 
  User, 
  ShieldAlert, 
  Moon, 
  Sun, 
  ShieldCheck, 
  SlidersHorizontal,
  LogOut,
  Sparkles
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/providers/auth-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, switchDevUser, signOut, isSupabaseConfigured } = useAuth();
  const [showDevModal, setShowDevModal] = useState(false);

  const navLinks = [
    { href: "/discover", label: "Discover", icon: Flame },
    { href: "/likes", label: "Likes", icon: Heart },
    { href: "/matches", label: "Matches", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  if (user?.role === "admin" || user?.role === "moderator") {
    navLinks.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
  }

  const isPublicPage = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/privacy",
    "/terms",
    "/safety",
    "/community-guidelines",
  ].includes(pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-xl leading-none gradient-text-primary">
              CHA ADDA
            </span>
            <span className="text-[10px] tracking-wider text-muted-foreground uppercase font-semibold">
              Find Your Match
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {user && !isPublicPage && (
          <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1.5 rounded-full border border-border/60">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Action Icons & Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-rose-500" />
            )}
          </button>

          {/* User Quick Switcher (For local testing & pairing simulation) */}
          <button
            onClick={() => setShowDevModal(!showDevModal)}
            title="Switch Test Account"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 text-xs font-semibold bg-secondary/60 hover:bg-secondary text-foreground transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{user ? user.display_name.split(" ")[0] : "Demo Persona"}</span>
          </button>

          {/* Authentication Actions */}
          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 rounded-full shadow-md shadow-rose-500/20 transition-all hover:scale-105"
              >
                Join Now
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/subscription"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Upgrade</span>
              </Link>

              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dev Switcher Drawer / Dropdown */}
      {showDevModal && (
        <div className="border-t border-border/60 bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary uppercase tracking-wider">Test Personas:</span>
              <span className="text-muted-foreground">Switch identity to test mutual matching & real-time chat:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "usr-aria-01", name: "Aria (Woman)", role: "user" },
                { id: "usr-julian-02", name: "Julian (Man)", role: "user" },
                { id: "usr-maya-03", name: "Maya (Woman)", role: "user" },
                { id: "usr-kaelen-04", name: "Kaelen (Man - Matched)", role: "user" },
                { id: "usr-admin-lead", name: "Admin Lead (Safety)", role: "admin" },
              ].map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    switchDevUser(persona.id);
                    setShowDevModal(false);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all",
                    user?.id === persona.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/20"
                  )}
                >
                  {persona.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
