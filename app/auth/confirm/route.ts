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
      // Check if it's a new signup by checking if they already have a profile
      const user = data.user;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, created_at")
        .eq("id", user.id)
        .maybeSingle();

      // Detection: If profile doesn't exist OR was created in the last 30 seconds
      // it means this is a fresh signup from the DB trigger
      const isNewSignup = !profile || (
        profile.created_at && 
        (new Date().getTime() - new Date(profile.created_at).getTime() < 30000)
      );

      if (isNewSignup) {
        await notifySignupAction(
          user.email || user.user_metadata?.email || "Unknown OAuth User",
          user.id,
          {
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
          }
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
