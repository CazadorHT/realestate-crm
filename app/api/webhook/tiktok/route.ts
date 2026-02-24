import { NextRequest, NextResponse } from "next/server";

/**
 * TikTok Webhook Handler
 * Supports URL verification and event reception.
 * URL: /api/webhook/tiktok
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle TikTok Webhook Verification
    // TikTok sends a POST request with a challenge parameter to verify the URL
    if (body.challenge) {
      console.log("✅ TikTok Webhook Verified with challenge:", body.challenge);
      return new Response(JSON.stringify({ challenge: body.challenge }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Handle TikTok Events (Future expansion)
    console.log("📥 TikTok Webhook Event Received:", body);

    // In the future, we can add logic here to handle lead events,
    // message events, etc., similar to the Meta webhook.

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("❌ TikTok Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Some TikTok integrations might use GET for verification similar to Meta
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge");
  const verifyToken = searchParams.get("verify_token");

  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("TikTok Webhook Active", { status: 200 });
}
