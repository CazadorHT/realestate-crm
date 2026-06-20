import { NextResponse } from "next/server";
import crypto from "crypto";

type MetaCapiRequestBody = {
  eventName?: string;
  eventId?: string;
  url?: string;
  customData?: {
    contentIds?: string[];
    contentName?: string;
    contentType?: string;
    value?: number;
    currency?: string;
    email?: string;
    phone?: string;
    fullName?: string;
  };
};

function hashSHA256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashEmail(email: string): string {
  return hashSHA256(email.trim().toLowerCase());
}

function hashPhone(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("0")) {
    normalized = "66" + normalized.slice(1);
  }
  return hashSHA256(normalized);
}

function hashNamePart(part: string): string {
  return hashSHA256(part.trim().toLowerCase());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MetaCapiRequestBody;
    const eventName = body.eventName?.trim();
    const eventId = body.eventId?.trim();
    const eventSourceUrl = body.url?.trim();

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const testEventCode = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE;

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { error: "Missing Meta API configuration" },
        { status: 500 },
      );
    }

    if (!eventName || !eventId) {
      return NextResponse.json(
        { error: "Missing eventName or eventId" },
        { status: 400 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const clientIpAddress = forwardedFor.split(",")[0]?.trim() || undefined;
    const clientUserAgent = request.headers.get("user-agent") || undefined;
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const separatorIndex = part.indexOf("=");
          if (separatorIndex === -1) return [part, ""];
          return [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))];
        }),
    );

    const fbp = typeof cookies._fbp === "string" && cookies._fbp.length > 0 ? cookies._fbp : undefined;
    const fbc = typeof cookies._fbc === "string" && cookies._fbc.length > 0 ? cookies._fbc : undefined;

    const email = body.customData?.email;
    const phone = body.customData?.phone;
    const fullName = body.customData?.fullName;

    const hashedEmail = email ? hashEmail(email) : undefined;
    const hashedPhone = phone ? hashPhone(phone) : undefined;
    let hashedFirstName: string | undefined;
    let hashedLastName: string | undefined;

    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      if (firstName) {
        hashedFirstName = hashNamePart(firstName);
      }
      if (lastName) {
        hashedLastName = hashNamePart(lastName);
      }
    }

    const unixTimestamp = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: unixTimestamp,
          event_id: eventId,
          action_source: "website",
          event_source_url: eventSourceUrl,
          user_data: {
            ...(clientIpAddress ? { client_ip_address: clientIpAddress } : {}),
            ...(clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
            ...(fbp ? { fbp } : {}),
            ...(fbc ? { fbc } : {}),
            ...(hashedEmail ? { em: [hashedEmail] } : {}),
            ...(hashedPhone ? { ph: [hashedPhone] } : {}),
            ...(hashedFirstName ? { fn: [hashedFirstName] } : {}),
            ...(hashedLastName ? { ln: [hashedLastName] } : {}),
          },
          custom_data: {
            content_ids: body.customData?.contentIds || [],
            content_name: body.customData?.contentName || "",
            content_type: body.customData?.contentType || "home_listing",
            value: Number(body.customData?.value) || 0,
            currency: body.customData?.currency || "THB",
          },
        },
      ],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    const metaResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const metaJson = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("[Meta CAPI] Meta API Error:", metaJson);
      return NextResponse.json(
        { error: "Meta API request failed", metaResponse: metaJson },
        { status: metaResponse.status },
      );
    }

    return NextResponse.json({ success: true, metaResponse: metaJson });
  } catch (error) {
    console.error("Meta CAPI Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}