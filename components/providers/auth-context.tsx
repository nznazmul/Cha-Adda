"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Profile } from "@/types/database";
import { devStore } from "@/lib/services/dev-store";
import { getAppEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  switchDevUser: (userId: string) => void;
  signOut: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isSupabaseConfigured: false,
  switchDevUser: () => {},
  signOut: async () => {},
  updateCurrentProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isSupabaseConfigured } = getAppEnv();

  useEffect(() => {
    async function initAuth() {
      if (!isSupabaseConfigured) {
        // Load default dev user from devStore
        const currentId = devStore.getCurrentUserId();
        const p = devStore.getProfile(currentId);
        setUser(p || null);
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser(profile || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        // Fallback to dev profile
        const p = devStore.getProfile("usr-aria-01");
        setUser(p || null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [isSupabaseConfigured]);

  const switchDevUser = (userId: string) => {
    devStore.setCurrentUserId(userId);
    const p = devStore.getProfile(userId);
    setUser(p || null);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const updateCurrentProfile = (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    devStore.saveProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseConfigured,
        switchDevUser,
        signOut,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
