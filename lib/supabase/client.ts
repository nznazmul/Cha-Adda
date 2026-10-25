import { createBrowserClient } from "@supabase/ssr";
import { getAppEnv } from "@/lib/config/env";

let clientInstance: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } = getAppEnv();

  if (typeof window !== "undefined" && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient(
    isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
    isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key"
  );

  if (typeof window !== "undefined") {
    clientInstance = client;
  }

  return client;
}
