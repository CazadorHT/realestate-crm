import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * 🔑 Auth MiddleWare Wrapper: Refreshes session and returns User context
 * Returns { response, user } to avoid redundant calls in main middleware.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              sameSite: "lax",
              path: "/",
            }),
          );
        },
      },
    },
  );

  // 🛡️ [PERFORMANCE] Check for auth cookie presence before calling getUser()
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.includes("-auth-token"));

  let user = null;
  if (hasAuthCookie) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // 1. Auth Protection (Basic Login)
  if (request.nextUrl.pathname.startsWith("/protected") && !user) {
    console.log(
      "[AUTH DEBUG] No user found for protected path, redirecting to login",
      {
        path: request.nextUrl.pathname,
        hasCookie: hasAuthCookie,
      },
    );
    return {
      response: NextResponse.redirect(new URL("/auth/login", request.url)),
      user: null,
    };
  }

  // 1.5 🛡️ Admin Route Access Control: Protect restricted admin paths from AGENT roles
  if (user && request.nextUrl.pathname.startsWith("/protected/admin")) {
    const isAllowedPath =
      request.nextUrl.pathname.startsWith("/protected/admin/popular-areas") ||
      request.nextUrl.pathname.startsWith("/protected/admin/master-data");

    if (!isAllowedPath) {
      // Query the role from DB to be certain of the role
      const { data: identity } = await supabase
        .from("identities_v3")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (identity?.role === "AGENT") {
        console.log(
          "[AUTH DEBUG] AGENT role blocked from accessing admin path:",
          request.nextUrl.pathname,
        );
        return {
          response: NextResponse.redirect(new URL("/protected", request.url)),
          user,
        };
      }
    }
  }

  // 2. 🛡️ [PHASE 2] Administrative MFA Enforcement (AAL2)
  // Protect ADMIN and MANAGER roles with Mandatory MFA
  const role = user?.app_metadata?.role as string | undefined;
  if (user && (role === "ADMIN" || role === "MANAGER")) {
    const { data: aal, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    // Check if user is currently AAL1 but should be AAL2
    if (!aalError && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const isMfaPage = request.nextUrl.pathname.startsWith("/auth/mfa");

      if (!isMfaPage) {
        // 🛡️ [HARDENING] Check for existing factors to decide redirect
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasFactors = (factors?.all?.length || 0) > 0;

        const path = hasFactors ? "/auth/mfa/verify" : "/auth/mfa/enroll";
        return {
          response: NextResponse.redirect(new URL(path, request.url)),
          user,
        };
      }
    }
  }

  return { response, user };
}
