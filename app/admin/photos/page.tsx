"use client";

import React, { useState, useEffect } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { useAuth } from "@/components/providers/auth-context";

interface PhotoItem {
  id: string;
  user_id: string;
  user_name: string;
  url: string;
  status: "pending" | "approved" | "rejected";
}

const mockPhotos: PhotoItem[] = [
  {
    id: "ph-1",
    user_id: "usr-aria-01",
    user_name: "Aria Vance",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    status: "approved",
  },
  {
    id: "ph-2",
    user_id: "usr-julian-02",
    user_name: "Julian Ross",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    status: "approved",
  },
  {
    id: "ph-3",
    user_id: "usr-kaelen-04",
    user_name: "Kaelen Miller",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    status: "approved",
  },
];

interface DBPhotoRow {
  id: string;
  user_id: string;
  url: string;
  moderation_status?: "pending" | "approved" | "rejected";
  profiles?: { display_name?: string } | null;
}

export default function AdminPhotosPage() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    const { isSupabaseConfigured } = getAppEnv();
    if (!isSupabaseConfigured) {
      return mockPhotos;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profile_photos")
        .select(`
          id,
          user_id,
          url,
          moderation_status,
          profiles:user_id (display_name)
        `)
        .order("created_at", { ascending: false })
        .limit(24);

      if (error || !data || data.length === 0) {
        return mockPhotos;
      }

      return (data as unknown as DBPhotoRow[]).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.profiles?.display_name || "Member",
        url: item.url,
        status: item.moderation_status || "approved",
      }));
    } catch (err) {
      console.error("Error loading photos:", err);
      return mockPhotos;
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    const list = await fetchPhotos();
    setPhotos(list);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    fetchPhotos().then((list) => {
      if (mounted) {
        setPhotos(list);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleReview = async (id: string, newStatus: "approved" | "rejected") => {
    setUpdatingId(id);
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );

    const { isSupabaseConfigured } = getAppEnv();
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase
          .from("profile_photos")
          .update({ moderation_status: newStatus })
          .eq("id", id);

        if (user) {
          await supabase.from("admin_audit_logs").insert({
            admin_id: user.id,
            action_type: `photo_${newStatus}`,
            target_type: "photo",
            target_id: id,
            reason: `Photo moderated to ${newStatus}`,
          });
        }
      } catch (err) {
        console.error("Failed to update photo status in DB:", err);
      }
    }

    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Photo Moderation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review uploaded profile photos for compliance with community guidelines.
          </p>
        </div>

        <button
          onClick={loadPhotos}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-secondary transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading photos from database...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          No photos found to moderate.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map((ph) => (
            <div
              key={ph.id}
              className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm flex flex-col group"
            >
              <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
                <img
                  src={ph.url}
                  alt={ph.user_name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    ph.status === "approved"
                      ? "bg-emerald-500 text-white"
                      : ph.status === "rejected"
                      ? "bg-destructive text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {ph.status}
                </span>
              </div>
              <div className="p-3 text-xs flex flex-col gap-2">
                <p className="font-bold truncate" title={ph.user_name}>
                  {ph.user_name}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleReview(ph.id, "approved")}
                    disabled={updatingId === ph.id || ph.status === "approved"}
                    className="flex-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 font-bold transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <Check className="h-3 w-3" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReview(ph.id, "rejected")}
                    disabled={updatingId === ph.id || ph.status === "rejected"}
                    className="flex-1 py-1 rounded-lg bg-destructive/10 hover:bg-destructive hover:text-white text-destructive font-bold transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <X className="h-3 w-3" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
