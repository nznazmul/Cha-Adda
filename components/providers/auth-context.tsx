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
import { generateMemberIdFromUuid, getMemberId } from "@/lib/utils/member-id";

const LOCAL_STORAGE_USER_KEY = "cha_adda_auth_user";

function getCachedUser(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id) {
      if (!parsed.unique_id) parsed.unique_id = getMemberId(parsed);
      return parsed as Profile;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
}

function setCachedUser(profile: Profile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

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
): Promise<Profile> {
  const emailName = authUser.email ? authUser.email.split("@")[0] : "Member";
  const displayName =
    authUser.user_metadata?.display_name ||
    authUser.user_metadata?.name ||
    emailName;
  const uniqueId =
    authUser.user_metadata?.unique_id || generateMemberIdFromUuid(authUser.id);

  const isAdmin =
    authUser.email === "admin@chaadda.com" ||
    authUser.email === "xprttanvir@gmail.com" ||
    authUser.email === "testadmin@chaadda.com" ||
    authUser.user_metadata?.role === "admin";

  const fallbackProfile: Profile = {
    id: authUser.id,
    unique_id: uniqueId,
    display_name: displayName,
    date_of_birth: "2000-01-01",
    gender: "other",
    city: "Dhaka",
    role: (isAdmin ? "admin" : "user") as Profile["role"],
    phone: authUser.phone || authUser.user_metadata?.phone || null,
    account_status: "active",
    is_discoverable: true,
    profile_complete: true,
    dating_intentions: [],
    interests: [],
    languages: ["English", "Bengali"],
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existingProfile) {
      return {
        ...fallbackProfile,
        ...existingProfile,
        role: (existingProfile.role === "admin" || isAdmin) ? "admin" : (existingProfile.role || "user"),
        unique_id: getMemberId(existingProfile) || uniqueId,
        phone: existingProfile.phone ?? authUser.phone ?? authUser.user_metadata?.phone ?? null,
        verified: existingProfile.verified ?? authUser.user_metadata?.verified ?? false,
        verified_until: existingProfile.verified_until ?? authUser.user_metadata?.verified_until ?? null,
      } as Profile;
    }

    // Auto-provision initial profile if missing in database
    const initialProfile = {
      id: authUser.id,
      display_name: displayName,
      date_of_birth: "2000-01-01",
      gender: "other",
      city: "Dhaka",
      role: (isAdmin ? "admin" : "user") as Profile["role"],
      account_status: "active",
      is_discoverable: true,
      profile_complete: true,
      dating_intentions: [],
      interests: [],
      languages: ["English", "Bengali"],
    };

    const { data: inserted } = await supabase
      .from("profiles")
      .insert(initialProfile)
      .select()
      .maybeSingle();

    if (inserted) {
      return {
        ...fallbackProfile,
        ...(inserted as Profile),
        phone: (inserted as Profile).phone ?? fallbackProfile.phone,
        unique_id: uniqueId,
      };
    }

    return fallbackProfile;
  } catch (err) {
    console.warn("Using authenticated fallback profile:", err);
    return fallbackProfile;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Profile | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState(() => !getCachedUser());
  const { isSupabaseConfigured } = getAppEnv();

  const setUser = useCallback(
    (val: Profile | null | ((prev: Profile | null) => Profile | null)) => {
      setUserState((prev) => {
        const next = typeof val === "function" ? val(prev) : val;
        setCachedUser(next);
        return next;
      });
    },
    []
  );

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
      return user;
    }
  }, [isSupabaseConfigured, setUser, user]);

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

        let profileChannel: ReturnType<typeof supabase.channel> | undefined;

        if (session?.user) {
          const profile = await getOrProvisionProfile(supabase, session.user);
          setUser(profile);

          profileChannel = supabase
            .channel(`profile-realtime-${session.user.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${session.user.id}`,
              },
              (payload: { new: Record<string, unknown> }) => {
                if (payload.new) {
                  setUser((prev) => ({ ...(prev || {}), ...(payload.new as unknown as Profile) }));
                }
              }
            )
            .subscribe();
        } else {
          // If no session found on server, clear cached user
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
            }
          }
        );

        unsubscribe = () => {
          subscription.unsubscribe();
          if (profileChannel) supabase.removeChannel(profileChannel);
        };
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupabaseConfigured, setUser]);

  const switchDevUser = (userId: string) => {
    devStore.setCurrentUserId(userId);
    const p = devStore.getProfile(userId);
    setUser(p || null);
  };

  const signOut = async () => {
    setUser(null);
    setCachedUser(null);
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Sign out error:", err);
      }
    }
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
          // If verification state changed, save to auth user_metadata
          if (updates.verified !== undefined || updates.verified_until !== undefined) {
            try {
              await supabase.auth.updateUser({
                data: {
                  verified: updates.verified !== undefined ? updates.verified : user?.verified,
                  verified_until:
                    updates.verified_until !== undefined ? updates.verified_until : user?.verified_until,
                },
              });
            } catch (authErr) {
              console.warn("Could not sync verification to auth metadata:", authErr);
            }
          }

          const { verified: _v, verified_until: _vu, ...dbFields } = updates;
          void _v;
          void _vu;
          const profilePayload = {
            id: authUser.id,
            display_name: updates.display_name || user?.display_name || "New Member",
            date_of_birth: updates.date_of_birth || user?.date_of_birth || "2000-01-01",
            gender: updates.gender || user?.gender || "other",
            city: updates.city || user?.city || "Dhaka",
            ...dbFields,
            updated_at: new Date().toISOString(),
          };

          const { data: savedProfile, error } = await supabase
            .from("profiles")
            .upsert(profilePayload)
            .select()
            .maybeSingle();

          if (!error && savedProfile) {
            setUser({
              ...(savedProfile as Profile),
              verified: updates.verified !== undefined ? updates.verified : user?.verified,
              verified_until:
                updates.verified_until !== undefined ? updates.verified_until : user?.verified_until,
            });
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
