import { createBrowserClient } from "@supabase/ssr";
import { getAppEnv } from "@/lib/config/env";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    // Return a dummy client proxy or default client that doesn't crash on initialize
    return createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-anon-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
