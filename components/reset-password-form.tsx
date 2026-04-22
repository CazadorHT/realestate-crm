"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PremiumAuthLayout } from "@/components/auth/premium-auth-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";

export function ResetPasswordForm() {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.errors.passwords_dont_match"));
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success(t("auth.success.password_updated"));
      router.push("/auth/login");
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : t("auth.errors.generic_error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PremiumAuthLayout
      view="other"
      title={
        <div className="flex flex-col items-center text-center space-y-4 pb-1 pt-6 sm:pt-8">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] bg-blue-500/10 border-blue-500/20 text-blue-400",
            )}
          >
            <KeyRound className="h-3 w-3" />
            ตั้งรหัสผ่านใหม่
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {t("auth.reset_password.title")}
          </h1>
          <p className="font-medium text-xs px-8 leading-relaxed text-slate-400">
            {t("auth.reset_password.subtitle")}
          </p>
        </div>
      }
    >
      <form onSubmit={handleResetPassword} className="space-y-6">
        <div className="space-y-4">
          {/* New Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1"
            >
              {t("auth.reset_password.new_password_label")}
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-all duration-300">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-12 w-full border px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="confirm-password"
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1"
            >
              {t("auth.reset_password.confirm_password_label")}
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-all duration-300">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex h-12 w-full border px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:border-blue-500/50 focus:ring-blue-500/10 transition-all text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <p className="text-[13px] text-red-400 font-semibold flex items-center gap-2">
              <span className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/20 text-[8px]">⚠️</span>
              {error}
            </p>
          </m.div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-base font-bold shadow-2xl rounded-xl transition-all active:scale-[0.98] bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              แป๊บน้า...
            </span>
          ) : (
            t("auth.reset_password.submit_btn")
          )}
        </Button>

        <div className="text-center">
          <Button
            variant="link"
            className="text-xs text-slate-500 hover:text-white"
            onClick={() => router.push("/auth/login")}
          >
            <ArrowLeft className="h-3 w-3 mr-2" />
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      </form>
    </PremiumAuthLayout>
  );
}
