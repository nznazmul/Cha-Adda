"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, Suspense } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Wrench, ShieldAlert, RefreshCw, LogIn, Lock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchPlatformSettings } from "@/lib/services/platform-settings-service";
import { PlatformSettings } from "@/types/database";

interface PlatformContextType {
  settings: PlatformSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: PlatformSettings = {
  min_age: 18,
  max_photos: 6,
  require_photo_to_discover: true,
  maintenance_mode: false,
};

const PlatformContext = createContext<PlatformContextType>({
  settings: defaultSettings,
  loading: false,
  refreshSettings: async () => {},
});

export function usePlatformSettings() {
  return useContext(PlatformContext);
}

export function PlatformGuard({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchPlatformSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to refresh platform settings:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchPlatformSettings()
      .then((data) => {
        if (mounted) {
          setSettings(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load platform settings:", err);
        if (mounted) setLoading(false);
      });

    // Listen to local window broadcast events for instant multi-tab sync
    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PlatformSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };

    window.addEventListener("cha_adda_settings_updated", handleCustomUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("cha_adda_settings_updated", handleCustomUpdate);
    };
  }, []);

  return (
    <PlatformContext.Provider value={{ settings, loading, refreshSettings }}>
      <Suspense fallback={<>{children}</>}>
        <MaintenanceContentGuard settings={settings} refreshSettings={refreshSettings}>
          {children}
        </MaintenanceContentGuard>
      </Suspense>
    </PlatformContext.Provider>
  );
}

function MaintenanceContentGuard({
  settings,
  refreshSettings,
  children,
}: {
  settings: PlatformSettings;
  refreshSettings: () => Promise<void>;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.role === "admin";
  const isAllowedPathDuringMaintenance =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/admin");

  // If maintenance mode is active and user is NOT admin
  if (settings.maintenance_mode && !isAdmin && !isAllowedPathDuringMaintenance) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Ambient glow backgrounds */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
          {/* Animated maintenance badge */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-inner">
            <Wrench className="h-10 w-10 animate-bounce duration-1000" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>রক্ষণাবেক্ষণ চলছে • Maintenance Mode</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              প্ল্যাটফর্ম সাময়িক স্থগিত
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              আমরা <span className="font-bold text-foreground">CHA ADDA</span> প্ল্যাটফর্মকে আরও নিরাপদ, গতিশীল ও উন্নত করতে নির্ধারিত সিস্টেম রক্ষণাবেক্ষণ পরিচালনা করছি। শীঘ্রই আমরা পুনরায় সবার জন্য উন্মুক্ত হব।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>আপগ্রেডের সময় কী কী স্থগিত থাকবে:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              <li>নতুন মেম্বার সাইন-আপ ও অনবোর্ডিং</li>
              <li>ডিসকভারি ফিড ও নতুন প্রোফাইল সোয়াইপিং</li>
              <li>সার্ভার ডেটাবেজ ও সিকিউরিটি অপ্টিমাইজেশন</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => refreshSettings()}
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>রিফ্রেশ করুন</span>
            </button>
            <Link
              href="/login"
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span>অ্যাডমিন লগইন</span>
            </Link>
          </div>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground/60">
          CHA ADDA Dating Platform • System Operations Lead
        </p>
      </div>
    );
  }

  return (
    <>
      {/* If admin is viewing the platform during maintenance, show persistent top warning */}
      {settings.maintenance_mode && isAdmin && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white px-4 py-2 text-xs font-bold text-center flex flex-wrap items-center justify-center gap-2 sm:gap-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 animate-pulse" />
            <span>সতর্কতা: প্ল্যাটফর্ম রক্ষণাবেক্ষণ মোড (Maintenance Mode) সক্রিয় রয়েছে!</span>
          </div>
          <span className="text-white/80 hidden sm:inline">|</span>
          <span className="text-[11px] font-normal text-white/90">
            সাধারণ ব্যবহারকারীদের জন্য সাইট ব্লক করা আছে। কেবল অ্যাডমিনদের অনুমতি রয়েছে।
          </span>
          <Link
            href="/admin/settings"
            className="underline font-black bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg transition-colors ml-1"
          >
            সেটিংস বন্ধ করুন →
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
