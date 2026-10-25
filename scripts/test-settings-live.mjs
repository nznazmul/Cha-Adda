import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function testSettings() {
  console.log("--- TEST 1: Fetch Admin User ---");
  const { data: adminUser } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("role", "admin")
    .limit(1)
    .single();

  console.log("Admin user:", adminUser);
  if (!adminUser) throw new Error("No admin user found!");

  console.log("\n--- TEST 2: Update System Settings (Turn Maintenance Mode ON) ---");
  const updateOn = {
    min_age: 18,
    max_photos: 8,
    require_photo_to_discover: true,
    maintenance_mode: true,
  };

  const { data: log1, error: err1 } = await supabase.from("admin_audit_logs").insert({
    admin_id: adminUser.id,
    action_type: "PLATFORM_SETTINGS",
    target_type: "system",
    target_id: adminUser.id,
    reason: "System settings updated: maintenance=true, max_photos=8",
    metadata: updateOn,
  }).select().single();

  console.log("Insert result (Maintenance ON):", { id: log1?.id, error: err1 });

  console.log("\n--- TEST 3: Fetch latest settings from Supabase ---");
  const { data: fetched1 } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .eq("action_type", "PLATFORM_SETTINGS")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  console.log("Fetched metadata:", fetched1?.metadata);
  if (fetched1?.metadata?.maintenance_mode !== true) {
    throw new Error("Failed: maintenance_mode is not true!");
  }
  console.log("SUCCESS: Maintenance mode is verified TRUE in live database!");

  console.log("\n--- TEST 4: Turn Maintenance Mode back OFF ---");
  const updateOff = {
    min_age: 18,
    max_photos: 6,
    require_photo_to_discover: true,
    maintenance_mode: false,
  };

  const { data: log2, error: err2 } = await supabase.from("admin_audit_logs").insert({
    admin_id: adminUser.id,
    action_type: "PLATFORM_SETTINGS",
    target_type: "system",
    target_id: adminUser.id,
    reason: "System settings updated: maintenance=false, max_photos=6",
    metadata: updateOff,
  }).select().single();

  console.log("Insert result (Maintenance OFF):", { id: log2?.id, error: err2 });

  const { data: fetched2 } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .eq("action_type", "PLATFORM_SETTINGS")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  console.log("Fetched metadata:", fetched2?.metadata);
  if (fetched2?.metadata?.maintenance_mode !== false) {
    throw new Error("Failed: maintenance_mode is not false!");
  }
  console.log("SUCCESS: Maintenance mode is verified FALSE in live database!");
  console.log("\nALL SYSTEM SETTINGS LIVE DATABASE TESTS PASSED!");
}

testSettings().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
