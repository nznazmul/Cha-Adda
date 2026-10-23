"use client";

import React, { useState } from "react";
import { Sliders, Shield, Save, Check } from "lucide-react";

export default function AdminSettingsPage() {
  const [minAge, setMinAge] = useState(18);
  const [maxPhotos, setMaxPhotos] = useState(6);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [requirePhotoToDiscover, setRequirePhotoToDiscover] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">System Configuration</h2>
        <p className="text-xs text-muted-foreground">
          Platform-wide dating constraints, upload limits, and safety controls.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-semibold text-center">
          System parameters updated!
        </div>
      )}

      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
            Minimum Age Requirement (Years)
          </label>
          <input
            type="number"
            min={18}
            max={25}
            value={minAge}
            disabled
            className="w-full max-w-xs rounded-xl border border-border bg-secondary/50 px-4 py-2 text-xs font-semibold"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Hard-locked at 18+ to comply with adult platform regulations.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
            Maximum Uploaded Photos Per Profile
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={maxPhotos}
            onChange={(e) => setMaxPhotos(Number(e.target.value))}
            className="w-full max-w-xs rounded-xl border border-border bg-background px-4 py-2 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm font-semibold">Require Primary Photo For Discovery</p>
            <p className="text-xs text-muted-foreground">
              Profiles without an approved photo will not appear in the discovery stack.
            </p>
          </div>
          <input
            type="checkbox"
            checked={requirePhotoToDiscover}
            onChange={(e) => setRequirePhotoToDiscover(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-destructive">Platform Maintenance Mode</p>
            <p className="text-xs text-muted-foreground">
              Temporarily halts new registrations and discovery for scheduled upgrades.
            </p>
          </div>
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
            className="h-5 w-5 accent-destructive"
          />
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95"
        >
          <Save className="h-4 w-4" />
          <span>Save System Settings</span>
        </button>
      </div>
    </div>
  );
}
