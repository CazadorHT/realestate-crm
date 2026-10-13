import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshProjectStatsView } from "@/features/properties/actions/refresh-stats";
import { revalidatePropertyPublicCache } from "@/features/properties/actions/revalidate-property-cache";
import { getAuthContextOrNull, isAdmin } from "@/lib/authz";

/**
 * 🔒 Fortress Verification: Only allow authorized callers to trigger global cache purge.
 * Supports:
 * 1. Bearer Token or x-internal-key header (Cron jobs, Webhooks, Scripts)
 * 2. URL query param `?secret=...`
 * 3. Authenticated CRM Admin Session (via Cookie)
 */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  const internalKey = req.headers.get("x-internal-key");
  const secretParam = req.nextUrl.searchParams.get("secret");

  const expectedCronSecret = process.env.CRON_SECRET;
  const expectedInternalKey = process.env.INTERNAL_BYPASS_KEY;
  const expectedServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    (expectedCronSecret && authHeader === `Bearer ${expectedCronSecret}`) ||
    (expectedInternalKey && (internalKey === expectedInternalKey || authHeader === `Bearer ${expectedInternalKey}`)) ||
    (expectedServiceRoleKey && authHeader === `Bearer ${expectedServiceRoleKey}`) ||
    (expectedCronSecret && secretParam === expectedCronSecret) ||
    (expectedInternalKey && secretParam === expectedInternalKey)
  ) {
    return true;
  }

  // Check logged-in CRM Admin / Staff user
  try {
    const authCtx = await getAuthContextOrNull();
    if (authCtx && isAdmin(authCtx.role)) {
      return true;
    }
  } catch {
    // Unauthenticated or context error
  }

  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    await revalidatePropertyPublicCache();
    await refreshProjectStatsView(supabase);
    return NextResponse.json({ success: true, message: "Multilingual cache purged and view refreshed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    await revalidatePropertyPublicCache();
    await refreshProjectStatsView(supabase);
    return NextResponse.json({ success: true, message: "Multilingual cache purged and view refreshed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
