"use client";

import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  Save, 
  Check, 
  AlertTriangle, 
  Database, 
  RefreshCw, 
  Lock, 
  Image as ImageIcon,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchPlatformSettings, savePlatformSettings } from "@/lib/services/platform-settings-service";
import { usePlatformSettings } from "@/components/providers/platform-guard";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { refreshSettings } = usePlatformSettings();

  const [minAge, setMinAge] = useState(18);
  const [maxPhotos, setMaxPhotos] = useState(6);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [requirePhotoToDiscover, setRequirePhotoToDiscover] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchPlatformSettings()
      .then((data) => {
        if (mounted) {
          setMinAge(data.min_age);
          setMaxPhotos(data.max_photos);
          setMaintenanceMode(data.maintenance_mode);
          setRequirePhotoToDiscover(data.require_photo_to_discover);
          if (data.updated_at) {
            setLastUpdated(new Date(data.updated_at).toLocaleString());
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading system settings:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await savePlatformSettings(
        {
          min_age: minAge,
          max_photos: maxPhotos,
          require_photo_to_discover: requirePhotoToDiscover,
          maintenance_mode: maintenanceMode,
        },
        user.id
      );

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: maintenanceMode
            ? "সিস্টেম সেটিংস সংরক্ষিত হয়েছে! প্ল্যাটফর্ম মেইনটেনেন্স মোড এখন সক্রিয়।"
            : "সিস্টেম সেটিংস সফলভাবে লাইভ ডাটাবেজে সংরক্ষিত ও কার্যকর হয়েছে!",
        });
        setLastUpdated(new Date().toLocaleString());
        await refreshSettings();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: (err as Error).message || "অপ্রত্যাশিত ত্রুটি ঘটেছে।",
      });
    } finally {
      setSaving(false);
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with DB Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            <span>সিস্টেম কনফিগারেশন ও সেটিংস</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            প্ল্যাটফর্মের মেইনটেনেন্স মোড, বয়সসীমা, ফটো সীমা ও লাইভ নিয়ন্ত্রণ ব্যবস্থা।
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
          <Database className="h-3.5 w-3.5" />
          <span>লাইভ ডাটাবেজ সংযুক্ত</span>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center gap-3 transition-all ${
            statusMessage.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border border-destructive/30 bg-destructive/15 text-destructive"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">ডাটাবেজ থেকে সেটিংস লোড করা হচ্ছে...</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-8">
          {/* Maintenance Mode Card (Highlighted) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            maintenanceMode 
              ? "bg-destructive/10 border-destructive/40 ring-1 ring-destructive/30" 
              : "bg-secondary/40 border-border"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className={`h-4 w-4 ${maintenanceMode ? "text-destructive" : "text-muted-foreground"}`} />
                  <p className="text-sm font-bold text-foreground">
                    প্ল্যাটফর্ম রক্ষণাবেক্ষণ মোড (Platform Maintenance Mode)
                  </p>
                  {maintenanceMode && (
                    <span className="px-2 py-0.5 rounded-full bg-destructive text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  সক্রিয় করলে সাধারণ ভিজিটর ও ব্যবহারকারীরা সাইটে ঢুকতে পারবে না (রক্ষণাবেক্ষণ পেজ দেখবে)। শুধুমাত্র অ্যাডমিনরা সাইটে প্রবেশ ও পরিচালনা করতে পারবেন।
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-destructive shadow-inner" />
              </label>
            </div>
          </div>

          {/* Discovery Photo Requirement */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-foreground">
                  ডিসকভারির জন্য প্রোফাইল ছবি বাধ্যতামূলক (Require Photo For Discovery)
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                সক্রিয় থাকলে প্রোফাইল ছবি ছাড়া কোনো অ্যাকাউন্ট ডিসকভারি ফিডে প্রদর্শিত হবে না এবং ইউজার সোয়াইপ করতে চাইলে আগে ছবি আপলোড করতে হবে।
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={requirePhotoToDiscover}
                onChange={(e) => setRequirePhotoToDiscover(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner" />
            </label>
          </div>

          <div className="border-t border-border" />

          {/* Minimum Age */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <label className="text-xs font-bold uppercase text-foreground">
                সর্বনিম্ন বয়স সীমা (Minimum Age Requirement)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={18}
                max={25}
                value={minAge}
                onChange={(e) => setMinAge(Math.max(18, Number(e.target.value)))}
                className="w-32 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold focus:border-primary focus:outline-none text-center"
              />
              <span className="text-xs text-muted-foreground font-semibold">বছর (১৮ এর নিচে নামানো যাবে না)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              ১৮+ প্রাপ্তবয়স্কদের ডেটিং প্ল্যাটফর্ম আইনগত সুরক্ষার অংশ হিসেবে সর্বনিম্ন বয়স ১৮ নির্ধারিত।
            </p>
          </div>

          <div className="border-t border-border" />

          {/* Max Photos Limit */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <label className="text-xs font-bold uppercase text-foreground">
                প্রতি প্রোফাইলে সর্বোচ্চ ছবির সংখ্যা (Maximum Photos Limit)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={12}
                value={maxPhotos}
                onChange={(e) => setMaxPhotos(Math.max(1, Math.min(12, Number(e.target.value))))}
                className="w-32 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold focus:border-primary focus:outline-none text-center"
              />
              <span className="text-xs text-muted-foreground font-semibold">টি ছবি (১ থেকে ১২ টি পর্যন্ত)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              ইউজাররা তাদের প্রোফাইলে সর্বোচ্চ কতটি পোর্ট্রেট বা ছবি যুক্ত করতে পারবে।
            </p>
          </div>

          {/* Save Action & Info */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[11px] text-muted-foreground">
              {lastUpdated && (
                <span>সর্বশেষ আপডেট: <span className="font-semibold text-foreground">{lastUpdated}</span></span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/25 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>ডাটাবেজে সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>সেভ সিস্টেম সেটিংস (Save Settings)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
