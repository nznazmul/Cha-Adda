"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Heart, Search, Sparkles, ChevronRight, CheckCheck, Clock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchUserMatches } from "@/lib/services/matching-service";
import { Match } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      if (!user) return;
      setLoading(true);
      try {
        const list = await fetchUserMatches(user.id);
        setMatches(list);
      } catch (err) {
        console.error("Error loading matches:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [user]);

  const filteredMatches = matches.filter((m) =>
    m.other_user?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mutual Matches</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            People who liked you back. Start a conversation!
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
          {matches.length}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search matches by name..."
          className="w-full rounded-2xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          Loading your matches...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary mb-3">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">No matches yet</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Keep swiping on Discover. When two people like each other, their conversation appears right here.
          </p>
          <Link
            href="/discover"
            className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95"
          >
            Start Swiping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const partner = match.other_user;
            if (!partner) return null;

            return (
              <Link
                key={match.id}
                href={`/chat/${match.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all hover:scale-[1.01] shadow-sm group"
              >
                {/* Partner Thumbnail */}
                <div className="relative h-14 w-14 rounded-2xl overflow-hidden shrink-0 border border-border">
                  <img
                    src={partner.primary_photo_url || partner.photos[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
                    alt={partner.display_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>

                {/* Details & Latest Message Snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                      {partner.display_name}, {partner.age}
                    </h3>
                    {match.last_message && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatDate(match.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {match.last_message
                      ? match.last_message.content
                      : `Matched on ${new Date(match.created_at).toLocaleDateString()}`}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
