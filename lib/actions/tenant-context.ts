"use server";

import { cookies } from "next/headers";

const TENANT_COOKIE_NAME = "active_tenant_id";

/**
 * Sets the active tenant ID in a cookie.
 * Use "ALL" to represent "All Branches".
 */
export async function setActiveTenantCookieAction(tenantId: string | null) {
  try {
    const cookieStore = await cookies();
    
    if (!tenantId) {
      cookieStore.delete(TENANT_COOKIE_NAME);
    } else {
      cookieStore.set(TENANT_COOKIE_NAME, tenantId, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  } catch (err) {
    console.error("Failed to set tenant cookie:", err);
  }
}

/**
 * Retrieves the active tenant ID from the cookie on the server.
 */
export async function getActiveTenantCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(TENANT_COOKIE_NAME)?.value || null;
}
