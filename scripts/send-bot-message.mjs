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

async function run() {
  const targetEmail = "xprttanvir@gmail.com";
  console.log(`Looking up user with email: ${targetEmail}...`);

  // 1. Find user in auth.users
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("Error listing users:", listErr);
    process.exit(1);
  }

  const targetUser = list.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
  if (!targetUser) {
    console.error(`User with email ${targetEmail} not found in auth.users!`);
    console.log("Total users:", list.users.length);
    console.log("Sample emails:", list.users.slice(0, 10).map(u => u.email));
    process.exit(1);
  }

  console.log(`Found target user: ID = ${targetUser.id}, Email = ${targetUser.email}`);

  // 2. Check profile
  let { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetUser.id)
    .single();

  if (profErr || !profile) {
    console.log("Target user profile not found or incomplete, checking metadata...");
    // Auto provision profile if needed
    const { data: newProf, error: createProfErr } = await supabase
      .from("profiles")
      .upsert({
        id: targetUser.id,
        display_name: targetUser.user_metadata?.display_name || targetUser.user_metadata?.full_name || "Tanvir",
        date_of_birth: "1998-01-01",
        gender: "man",
        orientation: "Straight",
        city: "Dhaka",
        is_discoverable: true,
        profile_complete: true,
        account_status: "active",
        role: "user"
      })
      .select()
      .single();

    if (createProfErr) {
      console.error("Failed to provision profile:", createProfErr);
    } else {
      profile = newProf;
      console.log("Profile provisioned for target user:", profile.display_name);
    }
  } else {
    console.log(`Target profile found: ${profile.display_name} (${profile.city})`);
  }

  // 3. Find a bot (e.g. আরোহী চৌধুরী - bot.female.01@cha-adda.internal)
  const botEmail = "bot.female.01@cha-adda.internal";
  const botUser = list.users.find(u => u.email === botEmail);
  if (!botUser) {
    console.error("Bot user not found!");
    process.exit(1);
  }

  const { data: botProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", botUser.id)
    .single();

  console.log(`Selected bot: ${botProfile?.display_name || "আরোহী চৌধুরী"} (ID: ${botUser.id})`);

  // 4. Create or get match between target user and bot
  const userA = targetUser.id < botUser.id ? targetUser.id : botUser.id;
  const userB = targetUser.id < botUser.id ? botUser.id : targetUser.id;

  // Insert swipes both ways to make it authentic
  await supabase.from("swipes").upsert([
    {
      from_user_id: botUser.id,
      to_user_id: targetUser.id,
      action: "like"
    },
    {
      from_user_id: targetUser.id,
      to_user_id: botUser.id,
      action: "like"
    }
  ], { onConflict: "from_user_id,to_user_id" });

  let { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("*")
    .eq("user_a_id", userA)
    .eq("user_b_id", userB)
    .maybeSingle();

  if (!match) {
    const { data: newMatch, error: createMatchErr } = await supabase
      .from("matches")
      .insert({
        user_a_id: userA,
        user_b_id: userB,
        status: "active"
      })
      .select()
      .single();

    if (createMatchErr) {
      console.error("Error creating match:", createMatchErr);
      process.exit(1);
    }
    match = newMatch;
    console.log("Created new match:", match.id);
  } else {
    console.log("Existing match found:", match.id);
  }

  // 5. Send message from bot to target user
  const messageContent = "শুভ সন্ধ্যা! কেমন আছেন? আপনার প্রোফাইলটা খুব ভালো লাগলো, এক কাপ ধোঁয়া ওঠা চা আর আড্ডায় গল্প করা যায় কিন্তু! 😊☕";

  const { data: msg, error: msgErr } = await supabase
    .from("messages")
    .insert({
      match_id: match.id,
      sender_id: botUser.id,
      content: messageContent
    })
    .select()
    .single();

  if (msgErr) {
    console.error("Error sending message:", msgErr);
    process.exit(1);
  }

  console.log(`Message successfully sent from ${botProfile.display_name}! Message ID: ${msg.id}`);
  console.log(`Content: "${msg.content}"`);

  // 6. Create notifications
  await supabase.from("notifications").insert([
    {
      recipient_id: targetUser.id,
      type: "match",
      title: "নতুন ম্যাচ!",
      body: `${botProfile.display_name}-এর সাথে আপনার ম্যাচ হয়েছে!`,
      reference_id: match.id
    },
    {
      recipient_id: targetUser.id,
      type: "message",
      title: `${botProfile.display_name} থেকে নতুন মেসেজ`,
      body: messageContent.slice(0, 80) + "...",
      reference_id: match.id
    }
  ]);

  console.log("Notifications created successfully!");
}

run();
