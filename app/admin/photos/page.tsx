"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Check, X, ShieldAlert } from "lucide-react";

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState([
    {
      id: "ph-1",
      user_name: "Aria Vance",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      status: "approved",
    },
    {
      id: "ph-2",
      user_name: "Julian Ross",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      status: "approved",
    },
    {
      id: "ph-3",
      user_name: "Kaelen Miller",
      url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      status: "approved",
    },
  ]);

  const handleReview = (id: string, newStatus: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Photo Moderation</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review uploaded profile photos for compliance with community guidelines.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((ph) => (
          <div
            key={ph.id}
            className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm flex flex-col"
          >
            <div className="relative aspect-[3/4] bg-secondary">
              <img src={ph.url} alt="" className="w-full h-full object-cover" />
              <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                ph.status === "approved" ? "bg-emerald-500 text-white" : "bg-destructive text-white"
              }`}>
                {ph.status}
              </span>
            </div>
            <div className="p-3 text-xs flex flex-col gap-2">
              <p className="font-bold truncate">{ph.user_name}</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleReview(ph.id, "approved")}
                  className="flex-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleReview(ph.id, "rejected")}
                  className="flex-1 py-1 rounded-lg bg-destructive/10 hover:bg-destructive hover:text-white text-destructive font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <X className="h-3 w-3" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
