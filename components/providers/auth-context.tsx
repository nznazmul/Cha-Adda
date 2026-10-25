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
    let unsubscribe: (() => void) | undefined;

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
            .maybeSingle();

          setUser(profile || null);
        } else {
          setUser(null);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "PASSWORD_RECOVERY") {
            window.location.href = "/reset-password";
            return;
          }
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();
            setUser(profile || null);
          } else {
            setUser(null);
          }
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch (err) {
        console.error("Auth init error:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
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

  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    const updated = { ...(user || {}), ...updates } as Profile;
    setUser(updated);
    devStore.saveProfile(updated);

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const profilePayload = {
            id: authUser.id,
            display_name: updates.display_name || user?.display_name || "New Member",
            date_of_birth: updates.date_of_birth || user?.date_of_birth || "2000-01-01",
            gender: updates.gender || user?.gender || "nonbinary",
            city: updates.city || user?.city || "Dhaka",
            ...updates,
            updated_at: new Date().toISOString(),
          };
          const { data: savedProfile, error } = await supabase
            .from("profiles")
            .upsert(profilePayload)
            .select()
            .maybeSingle();

          if (!error && savedProfile) {
            setUser(savedProfile);
          } else if (error) {
            console.error("Supabase profile save error:", error);
          }
        }
      } catch (err) {
        console.error("Failed to update profile in Supabase:", err);
      }
    }
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
