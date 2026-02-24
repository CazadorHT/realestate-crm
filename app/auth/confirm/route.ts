import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { notifySignupAction } from "@/features/audit/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to specified redirect URL or root of app
      return redirect(next);
    } else {
      // redirect the user to an error page with some instructions
      return redirect(
        `/auth/error?error=${encodeURIComponent(error?.message || "Verify OTP failed")}`,
      );
    }
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Check if it's a new signup
      const user = data.user;
      const isNew =
        !user.last_sign_in_at ||
        new Date(user.last_sign_in_at).getTime() ===
          new Date(user.created_at).getTime();

      if (isNew) {
        // Run in background (don't await to avoid blocking redirect, but here since it's a small task we can)
        await notifySignupAction(
          user.email || user.user_metadata?.email || "Unknown OAuth User",
        );
      }
      return redirect(next);
    } else {
      console.error("Supabase Auth Code Exchange Error:", error);
      return redirect(
        `/auth/error?error=${encodeURIComponent(error?.message || "Code exchange failed")}`,
      );
    }
  }

  // redirect the user to an error page with some instructions
  return redirect(
    `/auth/error?error=${encodeURIComponent("No token hash, type or code found")}`,
  );
}
