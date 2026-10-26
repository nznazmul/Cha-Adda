export interface AppEnv {
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  isSupabaseConfigured: boolean;
}

export function getAppEnv(): AppEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://cha-adda-meet-swap.vercel.app");

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    !supabaseAnonKey.includes("your-anon-key")
  );

  return {
    appUrl,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    isSupabaseConfigured: isConfigured,
  };
}

export const env = getAppEnv();
