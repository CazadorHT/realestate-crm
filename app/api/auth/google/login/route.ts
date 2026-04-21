import { NextRequest, NextResponse } from "next/server";
import { googleConfig } from "@/lib/google-config";
import { getBaseUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  const options = {
    redirect_uri: redirectUri,
    client_id: googleConfig.clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/business.manage",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
