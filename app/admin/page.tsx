"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Flame, 
  Heart, 
  MessageCircle, 
  Flag, 
  UserX, 
  ShieldCheck, 
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { fetchAdminMetrics } from "@/lib/services/admin-service";
import { AdminAnalyticsMetrics } from "@/types/database";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminAnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAdminMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Error loading admin metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: "Total Registered", value: metrics?.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Profiles", value: metrics?.activeUsers ?? 0, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Completed Profiles", value: metrics?.completedProfiles ?? 0, icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Likes Recorded", value: metrics?.totalLikes ?? 0, icon: Flame, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Mutual Matches", value: metrics?.totalMatches ?? 0, icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" },
    { label: "Messages Exchanged", value: metrics?.totalMessages ?? 0, icon: MessageCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Pending Reports", value: metrics?.pendingReports ?? 0, icon: Flag, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Suspended / Banned", value: (metrics?.suspendedUsers ?? 0) + (metrics?.bannedUsers ?? 0), icon: UserX, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">System Overview</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time member activity, match volume, report alerts, and safety health.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Moderation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Safety & Moderation Queue</h2>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Review incoming user reports regarding harassment, explicit imagery, spam, or underage concerns.
          </p>
          <div className="p-4 rounded-2xl border border-border bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold">{metrics?.pendingReports ?? 0} Pending Reports</span>
            </div>
            <Link
              href="/admin/reports"
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold"
            >
              Review Queue
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">User Directory & Status</h2>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage Users</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Inspect accounts, search members, verify adult requirements, or issue temporary suspensions.
          </p>
          <div className="p-4 rounded-2xl border border-border bg-secondary/30 flex items-center justify-between">
            <span className="text-xs font-bold">{metrics?.totalUsers ?? 0} Accounts Registered</span>
            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold border border-border"
            >
              Inspect Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
