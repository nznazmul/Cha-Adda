import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read env vars
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gozjcnfoomiqmzxcgsqo.supabase.co";
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || "").trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (key === "SUPABASE_SERVICE_ROLE_KEY") serviceRoleKey = val;
          if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
        }
      }
    }
  } catch (err) {
    console.error("Could not read .env.local:", err);
  }
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verify() {
  const tanvirId = "0d0de632-0625-4f13-bf55-769547a7fd8d";

  // Check matches
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a_id.eq.${tanvirId},user_b_id.eq.${tanvirId}`);

  console.log("Matches found:", matches?.length, matchErr || "");

  for (const m of matches || []) {
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", m.id)
      .order("created_at", { ascending: true });

    console.log(`Match ${m.id} has ${messages?.length} messages:`);
    for (const msg of messages || []) {
      console.log(`  - [${msg.created_at}] Sender ${msg.sender_id}: ${msg.content}`);
    }
  }

  // Check notifications
  const { data: notifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", tanvirId);

  console.log("Notifications for Tanvir:", notifs?.length);
  for (const n of notifs || []) {
    console.log(`  - [${n.type}] ${n.title}: ${n.body}`);
  }
}

verify();
