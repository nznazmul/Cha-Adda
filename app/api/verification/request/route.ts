import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, selfieUrl } = body;

    if (!userId || !selfieUrl) {
      return NextResponse.json(
        { error: "userId and selfieUrl are required" },
        { status: 400 }
      );
    }

    const { isSupabaseConfigured } = getAppEnv();

    // 1. In devStore, always record for quick access
    const devReq = devStore.submitVerificationRequest(userId, selfieUrl);

    // 2. In Supabase, record persistently via adminClient (service role bypasses user RLS)
    if (isSupabaseConfigured) {
      try {
        const adminClient = createAdminClient();

        // Try direct insert into verification_requests table if created
        try {
          await adminClient.from("verification_requests").insert({
            id: devReq.id,
            user_id: userId,
            selfie_url: selfieUrl,
            status: "pending",
          });
        } catch {
          // Table may not exist yet
        }

        // Always record in admin_audit_logs as persistent backup
        await adminClient.from("admin_audit_logs").insert({
          admin_id: userId,
          action_type: "SELFIE_VERIFICATION_SUBMITTED",
          target_type: "verification_request",
          target_id: devReq.id,
          reason: "User captured face and submitted selfie for Blue Tick verification",
          metadata: {
            requestId: devReq.id,
            userId,
            selfieUrl,
            status: "pending",
          },
        });
      } catch (err) {
        console.warn("Could not insert audit log for verification request:", err);
      }
    }

    return NextResponse.json({ success: true, request: devReq });
  } catch (err: unknown) {
    console.error("POST /api/verification/request error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const req = devStore.getVerificationRequestByUser(userId);
    return NextResponse.json({ request: req || null });
  } catch (err: unknown) {
    console.error("GET /api/verification/request error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
