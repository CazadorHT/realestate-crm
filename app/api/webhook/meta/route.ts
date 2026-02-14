import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMetaUserProfile } from "@/lib/meta";
import { saveOmniMessage } from "@/lib/line"; // reuse same util since it's generic enough

/**
 * GET handler for Meta Webhook Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === metaConfig.verifyToken) {
      console.log("✅ Meta Webhook Verified");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }
  return new Response("Bad Request", { status: 400 });
}

/**
 * POST handler for Meta Webhook Events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a page subscription
    if (body.object === "page") {
      for (const entry of body.entry) {
        // Facebook Messenger events
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
              await handleMetaMessage(messagingEvent, "FACEBOOK");
            }
          }
        }
      }
    }
    // Instagram subscription
    else if (body.object === "instagram") {
      for (const entry of body.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
              await handleMetaMessage(messagingEvent, "INSTAGRAM");
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Meta Webhook Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

async function handleMetaMessage(event: any, source: "FACEBOOK" | "INSTAGRAM") {
  const senderId = event.sender.id; // PSID
  const text = event.message.text || "";

  if (!senderId || !text) return;

  const supabase = createAdminClient();

  // 1. Find or Create Lead
  const idField = source === "FACEBOOK" ? "facebook_psid" : "instagram_sid";

  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq(idField, senderId)
    .single();

  if (!lead) {
    const profile = await getMetaUserProfile(senderId, source);

    // Explicitly construct insert object to avoid TS issues with dynamic keys
    const insertData: any = {
      full_name: profile?.name || `${source} Contact`,
      source: source,
      stage: "NEW",
      note: `Auto-captured from ${source}. Profile: ${JSON.stringify(profile)}`,
    };
    insertData[idField] = senderId;

    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert(insertData)
      .select("id")
      .single();

    if (createError) {
      console.error(`Error creating ${source} auto-lead:`, createError);
      return;
    }
    lead = newLead as { id: string };
  }

  // 2. Log Message to Omni-channel
  if (lead) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: source,
      external_message_id: event.message.mid,
      content: text,
      payload: event,
      direction: "INCOMING",
    });
  }
}
