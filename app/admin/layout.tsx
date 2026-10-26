"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Flag, 
  Image as ImageIcon, 
  BarChart3, 
  Sliders, 
  FileText, 
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  BadgeCheck
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdminOrMod = user?.role === "admin" || user?.role === "moderator";

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/verification", label: "User Verification", icon: BadgeCheck },
    { href: "/admin/reports", label: "Moderation Queue", icon: Flag },
    { href: "/admin/photos", label: "Photo Review", icon: ImageIcon },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "System Config", icon: Sliders },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  ];

  if (!isAdminOrMod) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold">Administrator Access Required</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The current account (<strong>{user?.display_name || "Guest"}</strong>) does not have moderator or administrator privileges.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/discover"
            className="w-full py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
          >
            Return to App
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Trust & Safety Console</h1>
              <span className="rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase shadow-sm">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified platform moderation, user controls, safety workflows, and audit tracking.
            </p>
          </div>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/80 bg-card hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dating App</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-56 xl:w-60 shrink-0">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto p-1.5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm lg:p-2 lg:bg-transparent lg:border-none lg:backdrop-blur-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-500/25 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/80 border border-transparent hover:border-border/60"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Admin Main Body */}
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}
