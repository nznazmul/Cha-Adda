import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { generateMemberIdFromUuid } from "@/lib/utils/member-id";
import { devStore } from "@/lib/services/dev-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const { isSupabaseConfigured } = getAppEnv();

    if (!isSupabaseConfigured) {
      // Dev store registration
      const newUserId = `usr-${Date.now()}`;
      const uniqueId = generateMemberIdFromUuid(newUserId);
      const profile = {
        id: newUserId,
        unique_id: uniqueId,
        display_name: displayName || email.split("@")[0] || "New Member",
        date_of_birth: "2000-01-01",
        gender: "other" as const,
        city: "Dhaka",
        role: "user" as const,
        account_status: "active" as const,
        is_discoverable: true,
        profile_complete: false,
        dating_intentions: [],
        interests: [],
        languages: ["English", "Bengali"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      devStore.saveProfile(profile);
      devStore.setCurrentUserId(newUserId);

      return NextResponse.json({
        success: true,
        user: { id: newUserId, email, unique_id: uniqueId },
      });
    }

    const adminSupabase = createAdminClient();

    // Check if user already exists
    const { data: existingList } = await adminSupabase.auth.admin.listUsers();
    const existing = existingList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    // Temporary unique ID based on a generated seed
    const tempUuid = crypto.randomUUID();
    const uniqueId = generateMemberIdFromUuid(tempUuid);
    const cleanDisplayName = displayName?.trim() || email.split("@")[0] || "New Member";

    // Create user with email_confirm: true so user is immediately verified and can sign in!
    const { data: newUser, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: cleanDisplayName,
          unique_id: uniqueId,
        },
      });

    if (createError || !newUser?.user) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create user account." },
        { status: 400 }
      );
    }

    const createdUserId = newUser.user.id;
    const finalUniqueId = generateMemberIdFromUuid(createdUserId);

    // Provision profile record in profiles table
    await adminSupabase.from("profiles").upsert(
      {
        id: createdUserId,
        display_name: cleanDisplayName,
        date_of_birth: "2000-01-01",
        gender: "other",
        city: "Dhaka",
        role: "user",
        account_status: "active",
        is_discoverable: true,
        profile_complete: false,
        dating_intentions: [],
        interests: [],
        languages: ["English", "Bengali"],
      },
      { onConflict: "id" }
    );

    // Provision default user settings
    await adminSupabase.from("user_settings").upsert(
      {
        user_id: createdUserId,
      },
      { onConflict: "user_id" }
    );

    // Provision default discovery preferences
    await adminSupabase.from("profile_preferences").upsert(
      {
        user_id: createdUserId,
      },
      { onConflict: "user_id" }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: createdUserId,
        email: newUser.user.email,
        unique_id: finalUniqueId,
      },
    });
  } catch (err: unknown) {
    console.error("Registration API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal registration error." },
      { status: 500 }
    );
  }
}
