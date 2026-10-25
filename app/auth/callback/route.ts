import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/reset-password";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const isAbsolute = next.startsWith("http://") || next.startsWith("https://");
        const redirectUrl = isAbsolute ? next : `${origin}${next}`;
        return NextResponse.redirect(redirectUrl);
      }
      console.error("Auth callback exchangeCodeForSession error:", error);
    } catch (err) {
      console.error("Exception during auth callback:", err);
    }
  }

  // Fallback to reset-password or login
  return NextResponse.redirect(`${origin}/reset-password?error=Invalid+or+expired+recovery+code`);
}
