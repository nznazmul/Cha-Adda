"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Heart, MessageCircle, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

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
    "/onboarding",
  ].includes(pathname);

  if (isPublicPage) return null;

  const items = [
    { href: "/discover", label: "Discover", icon: Flame },
    { href: "/likes", label: "Likes", icon: Heart },
    { href: "/matches", label: "Matches", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  if (user?.role === "admin" || user?.role === "moderator") {
    items.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/60 bg-background/95 backdrop-blur-lg px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 min-w-[56px]",
                isActive
                  ? "text-primary font-bold scale-105"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
