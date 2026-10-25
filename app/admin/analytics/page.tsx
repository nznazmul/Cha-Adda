"use client";

import React from "react";
import { BarChart3, TrendingUp, Users, Heart, MessageCircle } from "lucide-react";

export default function AdminAnalyticsPage() {
  const chartData = [
    { day: "Mon", likes: 45, matches: 12 },
    { day: "Tue", likes: 62, matches: 18 },
    { day: "Wed", likes: 80, matches: 24 },
    { day: "Thu", likes: 75, matches: 20 },
    { day: "Fri", likes: 98, matches: 32 },
    { day: "Sat", likes: 130, matches: 45 },
    { day: "Sun", likes: 110, matches: 38 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Product & Safety Analytics</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Platform engagement, conversion to match, and moderation resolution metrics.
        </p>
      </div>

      {/* Engagement Chart */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Weekly Likes & Match Volume</span>
          </div>
          <span className="text-xs text-muted-foreground">Last 7 Days</span>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-border">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="w-full flex justify-center gap-1 items-end h-full">
                {/* Likes Bar */}
                <div
                  style={{ height: `${(d.likes / 140) * 100}%` }}
                  className="w-1/2 max-w-[20px] rounded-t-md bg-rose-500/80 group-hover:bg-rose-500 transition-colors"
                  title={`${d.likes} Likes`}
                />
                {/* Matches Bar */}
                <div
                  style={{ height: `${(d.matches / 140) * 100}%` }}
                  className="w-1/2 max-w-[20px] rounded-t-md bg-amber-500/80 group-hover:bg-amber-500 transition-colors"
                  title={`${d.matches} Matches`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">{d.day}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-rose-500" />
            <span>Likes Recorded</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-amber-500" />
            <span>Mutual Matches</span>
          </div>
        </div>
      </div>
    </div>
  );
}
