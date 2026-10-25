"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Profile } from "@/types/database";
import { devStore } from "@/lib/services/dev-store";
import { getAppEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/client";
import { 
  User as SupabaseAuthUser, 
  SupabaseClient,
  AuthChangeEvent,
  Session
} from "@supabase/supabase-js";

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  switchDevUser: (userId: string) => void;
  signOut: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshAuth: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isSupabaseConfigured: false,
  switchDevUser: () => {},
  signOut: async () => {},
  updateCurrentProfile: async () => {},
  refreshAuth: async () => null,
});

async function getOrProvisionProfile(
  supabase: SupabaseClient,
  authUser: SupabaseAuthUser
): Promise<Profile | null> {
  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile as Profile;
    }

    // Auto-provision initial profile if missing in database
    const emailName = authUser.email ? authUser.email.split("@")[0] : "Member";
    const displayName =
      authUser.user_metadata?.display_name ||
      authUser.user_metadata?.name ||
      emailName;

    const initialProfile: Partial<Profile> = {
      id: authUser.id,
      display_name: displayName,
      date_of_birth: "2000-01-01",
      gender: "other",
      city: "Dhaka",
      role: "user",
      account_status: "active",
      is_discoverable: true,
      profile_complete: false,
      dating_intentions: [],
      interests: [],
      languages: ["English"],
    };

    const { data: inserted } = await supabase
      .from("profiles")
      .insert(initialProfile)
      .select()
      .maybeSingle();

    if (inserted) {
      return inserted as Profile;
    }

    const { data: retryProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    return (retryProfile || initialProfile) as Profile;
  } catch (err) {
    console.error("Error retrieving or creating user profile:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isSupabaseConfigured } = getAppEnv();

  const refreshAuth = useCallback(async (): Promise<Profile | null> => {
    if (!isSupabaseConfigured) {
      const currentId = devStore.getCurrentUserId();
      const p = devStore.getProfile(currentId);
      setUser(p || null);
      return p || null;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await getOrProvisionProfile(supabase, session.user);
        setUser(profile);
        return profile;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Auth refresh error:", err);
      setUser(null);
      return null;
    }
  }, [isSupabaseConfigured]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        const currentId = devStore.getCurrentUserId();
        const p = devStore.getProfile(currentId);
        setUser(p || null);
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await getOrProvisionProfile(supabase, session.user);
          setUser(profile);
        } else {
          setUser(null);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
          if (event === "PASSWORD_RECOVERY") {
            window.location.href = "/reset-password";
            return;
          }

          if (event === "SIGNED_OUT") {
            setUser(null);
            return;
          }

          if (session?.user) {
            const profile = await getOrProvisionProfile(supabase, session.user);
            setUser(profile);
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
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const profilePayload = {
            id: authUser.id,
            display_name: updates.display_name || user?.display_name || "New Member",
            date_of_birth: updates.date_of_birth || user?.date_of_birth || "2000-01-01",
            gender: updates.gender || user?.gender || "other",
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
            setUser(savedProfile as Profile);
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
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
