"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";

interface SocialAuthButtonsProps {
  isLogin: boolean;
}

export function SocialAuthButtons({ isLogin }: SocialAuthButtonsProps) {
  const supabase = createClient();

  const handleOAuth = async (provider: "google" | "facebook") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span
            className={cn(
              "w-full border-t transition-colors",
              isLogin ? "border-slate-100" : "border-white/5",
            )}
          />
        </div>
        <div
          className={cn(
            "relative flex justify-center text-[9px] font-medium uppercase tracking-[0.3em] transition-colors",
            isLogin ? "text-slate-400" : "text-slate-600",
          )}
        >
          <span
            className={cn(
              "px-3 transition-colors",
              isLogin ? "" : "bg-slate-950",
            )}
          >
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full h-12 rounded-xl transition-all font-bold gap-2 text-xs hover:scale-[1.02]",
            isLogin
              ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-700! hover:border-blue-500/30"
              : "border-white/5 bg-white/3 hover:bg-white/8 text-white hover:border-purple-500/30",
          )}
          onClick={() => handleOAuth("google")}
        >
          <FcGoogle className="h-6! w-6!" />
          <span>Google</span>
        </Button>
      </div>
    </div>
  );
}
