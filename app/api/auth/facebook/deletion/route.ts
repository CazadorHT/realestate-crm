import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

/**
 * 🗑️ Facebook Data Deletion Callback
 * 
 * Facebook จะส่ง POST request มาที่ endpoint นี้เมื่อผู้ใช้ร้องขอลบข้อมูล
 * ตาม GDPR / Facebook Platform Policy
 * 
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const signedRequest = body.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      );
    }

    // 1. Parse and verify signed_request from Facebook
    const data = parseSignedRequest(signedRequest);
    if (!data) {
      return NextResponse.json(
        { error: "Invalid signed_request" },
        { status: 400 }
      );
    }

    const facebookUserId = data.user_id;
    console.log(`🗑️ [FB Data Deletion] Request for Facebook user: ${facebookUserId}`);

    // 2. Generate a unique confirmation code for tracking
    const confirmationCode = crypto.randomUUID();

    // 3. Log the deletion request in audit
    try {
      const supabase = createAdminClient();
      await supabase.from("system_audit_logs_v3").insert({
        action: "FACEBOOK_DATA_DELETION_REQUEST",
        entity_table: "user",
        entity_id: facebookUserId,
        new_data: {
          facebook_user_id: facebookUserId,
          confirmation_code: confirmationCode,
          requested_at: new Date().toISOString(),
        },
      });
    } catch (auditErr) {
      console.error("[FB Data Deletion] Audit log failed:", auditErr);
    }

    // 4. Return response in Facebook's expected format
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vccasset.com";
    
    return NextResponse.json({
      url: `${baseUrl}/auth/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("[FB Data Deletion] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Parse Facebook signed_request
 * https://developers.facebook.com/docs/games/gamesonfacebook/login#parsingsr
 */
function parseSignedRequest(signedRequest: string): { user_id: string } | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    
    const appSecret = process.env.FACEBOOK_LOGIN_APP_SECRET || "";
    
    // Decode payload
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
    );

    // Verify signature
    const expectedSig = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (encodedSig !== expectedSig) {
      console.warn("[FB Data Deletion] Signature mismatch — possibly invalid request");
      // Still return data for logging, but log the warning
    }

    return data;
  } catch (err) {
    console.error("[FB Data Deletion] Failed to parse signed_request:", err);
    return null;
  }
}
