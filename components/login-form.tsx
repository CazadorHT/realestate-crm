"use client";

import { cn } from "@/lib/utils";
import { logActivityAction } from "@/features/audit/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { AuthHeader } from "./auth/auth-header";
import { SocialAuthButtons } from "./auth/social-auth-buttons";
import { PremiumAuthLayout } from "./auth/premium-auth-layout";
import { SiSupabase } from "react-icons/si";
import { BsShieldFillCheck } from "react-icons/bs";

import { notifyAdminsAction } from "@/lib/actions/notifications";

export type AuthView = "login" | "signup" | "forgot-password";

// --- Validation Schemas ---
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(true),
  honeypot: z.string().max(0).optional(), // Bot trap
});

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    honeypot: z.string().max(0).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  honeypot: z.string().max(0).optional(),
});

interface AuthValues {
  email: string;
  password?: string;
  confirmPassword?: string;
  rememberMe?: boolean;
  honeypot?: string;
}

interface LoginFormProps {
  defaultView?: AuthView;
}

export function LoginForm({ defaultView = "login" }: LoginFormProps) {
  const [view, setView] = useState<AuthView>(defaultView);
  const [direction, setDirection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopyPassword = (password: string) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Form Hooks ---
  const form = useForm<AuthValues>({
    resolver: async (data, context, options) => {
      const schema = view === "login" ? loginSchema : view === "signup" ? signupSchema : forgotSchema;
      return zodResolver(schema)(data, context, options);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = form;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDemoHost = window.location.hostname.startsWith("demo.") || window.location.search.includes("demo=true");
      if (isDemoHost && view === "login") {
        form.setValue("email", "demo@vccasset.com");
        form.setValue("password", "Demo2026!");
      }
    }
  }, [view, form]);

  const handleSetView = (newView: AuthView) => {
    const order: AuthView[] = ["forgot-password", "login", "signup"];
    const currentIndex = order.indexOf(view);
    const nextIndex = order.indexOf(newView);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setView(newView);
    setError(null);
    setSuccess(null);
    reset();
  };

  const onFormSubmit: SubmitHandler<AuthValues> = async (data) => {
    // Honeypot check: If bot filled it, just silently ignore or return
    if (data.honeypot) {
      console.warn("Bot detected via honeypot");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    try {
      if (view === "login") {
        // Set remember_me cookie for 5 minutes to guide server client session lifetime
        document.cookie = `remember_me=${!!data.rememberMe}; path=/; max-age=300; SameSite=Lax`;

        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password || "",
        });
        if (error) {
          await logActivityAction("LOGIN_FAILURE", "user", undefined, {
            email: data.email,
            error: error.message,
          });
          throw error;
        }

        // 🚀 Instant Transition: Navigate to CRM immediately without waiting for auxiliary DB tasks
        router.replace("/protected");

        // 🛡️ Background Auxiliary Tasks (Non-blocking): Update last_login, log activity, and notify admins
        (async () => {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
              await supabase.from("profiles").update({
                last_login_at: new Date().toISOString(),
                last_ip: "CLIENT_SIDE_FETCH"
              }).eq("id", authUser.id);
            }

            await logActivityAction("LOGIN", "user", undefined, {
              email: data.email,
              remember: data.rememberMe
            });

            await notifyAdminsAction({
              type: "INFO",
              title: "มีการเข้าสู่ระบบ 🔑",
              message: `ผู้ใช้ ${data.email} เข้าสู่ระบบแล้ว (Remember: ${data.rememberMe ? 'Yes' : 'No'})`,
              link: "/protected/settings/users",
            });
          } catch (e) {
            console.error("Auxiliary background login actions failed:", e);
          }
        })();
      } else if (view === "signup") {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password || "",
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });

        if (error) {
          await logActivityAction("SIGNUP_FAILURE", "user", undefined, {
            email: data.email,
            error: error.message,
          });
          throw error;
        }

        await logActivityAction("SIGNUP", "user", undefined, {
          email: data.email,
        });

        // 🔔 Notify Admins about the new signup
        await notifyAdminsAction({
          type: "SYSTEM",
          title: "มีผู้สมัครสมาชิกใหม่ 🆕",
          message: `มีผู้ใช้ใหม่สมัครสมาชิกด้วยอีเมล ${data.email}`,
          link: "/protected/settings/users",
        });

        reset();
        setSuccess("ส่งอีเมลยืนยันไปแล้วนะ! ไปเช็คดูใน Inbox ได้เลย");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          data.email,
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          },
        );
        if (error) throw error;
        reset();
        setSuccess("เราส่งลิงก์รีเซ็ตรหัสผ่านไปให้ทางอีเมลแล้วนะ!");
      }
    } catch (error: unknown) {
      let errorMessage = "อ๊ะ! มีอะไรบางอย่างผิดพลาด ลองใหม่อีกทีนะ";
      if (error instanceof Error) {
        if (view === "login" && error.message === "Invalid login credentials") {
          try {
            const { data: profileExists } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", data.email)
              .maybeSingle();

            if (!profileExists) {
              errorMessage = "คุณยังไม่ได้ลงทะเบียนเข้าใช้งานระบบ CRM ด้วยอีเมลนี้ กรุณาสมัครสมาชิกก่อน";
            } else {
              errorMessage = "คุณกรอกรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง";
            }
          } catch (checkErr) {
            console.error("Error checking profile existence:", checkErr);
            errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
          }
        } else if (error.message === "User already registered") {
          errorMessage = "หากมีบัญชีอยู่แล้ว คุณจะได้รับอีเมลยืนยันหรือลิงก์เข้าสู่ระบบ";
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isLogin = view === "login";
  const isSignUp = view === "signup";
  const isForgot = view === "forgot-password";

  const formVariants = {
    initial: (direction: number) => ({
      x: direction * 50,
      opacity: 0,
      filter: "blur(10px)",
    }),
    animate: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      x: direction * -50,
      opacity: 0,
      filter: "blur(10px)",
    }),
  };

  return (
    <PremiumAuthLayout
      view={view}
      title={
        <AuthHeader view={view} direction={direction} variants={formVariants} />
      }
    >
      <m.div layout className="">
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={view}
            custom={direction}
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="will-change-[transform,opacity,filter]"
          >
            {success ? (
              <div className="space-y-6 text-center py-4">
                <m.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-pulse"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </m.div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Operation Successful</h3>
                  <p className="text-sm text-slate-400 leading-relaxed px-4">
                    {success}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    handleSetView("login");
                  }}
                  className="w-full h-14 text-base font-bold shadow-2xl rounded-xl transition-all active:scale-[0.98] bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Sign In</span>
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onFormSubmit)}
                className="space-y-4 sm:space-y-6"
              >
                {/* Honeypot Field (Invisible to users) */}
                <div className="sr-only opacity-0 absolute -z-50 pointer-events-none">
                  <input
                    {...register("honeypot")}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className={cn(
                        "text-xs font-medium uppercase tracking-[0.15em] ml-1 transition-colors",
                        isLogin ? "text-slate-400" : "text-slate-500",
                      )}
                    >
                      Email Address
                    </Label>
                    <div className="relative group">
                      <div
                        className={cn(
                          "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
                          isLogin
                            ? "text-slate-400 group-focus-within:text-blue-600"
                            : isSignUp
                              ? "text-slate-600 group-focus-within:text-purple-500"
                              : "text-slate-600 group-focus-within:text-amber-500",
                        )}
                      >
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className={cn(
                          "pl-12 h-12 rounded-xl transition-all text-sm",
                          isLogin
                            ? "bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/5"
                            : isSignUp
                              ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/10"
                              : "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/10",
                          errors.email &&
                            "border-red-500/50 focus:border-red-500",
                        )}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[10px] text-red-500 ml-1 font-medium">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password - Hidden in Forgot View */}
                  {!isForgot && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <Label
                          htmlFor="password"
                          className={cn(
                            "text-xs font-medium uppercase tracking-[0.15em] transition-colors",
                            isLogin ? "text-slate-400" : "text-slate-500",
                          )}
                        >
                          Password
                        </Label>
                        {isLogin && (
                          <button
                            type="button"
                            onClick={() => handleSetView("forgot-password")}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 transition-colors underline decoration-blue-500/20 underline-offset-4"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <div
                          className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
                            isLogin
                              ? "text-slate-400 group-focus-within:text-blue-600"
                              : "text-slate-600 group-focus-within:text-purple-500",
                          )}
                        >
                          <Lock className="h-4.5 w-4.5" />
                        </div>
                        <Input
                          {...register("password")}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className={cn(
                            "pl-12 pr-12 h-12 rounded-xl transition-all text-sm",
                            isLogin
                              ? "bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/5"
                              : "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/10",
                            errors.password &&
                              "border-red-500/50 focus:border-red-500",
                          )}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {showPassword && (
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(form.getValues("password") || "")}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                isLogin
                                  ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                  : "text-slate-500 hover:text-purple-400 hover:bg-white/5",
                              )}
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isLogin
                                ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                : "text-slate-600 hover:text-slate-400 hover:bg-white/5",
                            )}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4.5 w-4.5" />
                            ) : (
                              <Eye className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {errors.password && (
                        <p className="text-[10px] text-red-500 ml-1 font-medium">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Remember Me (Login only) */}
                  {isLogin && (
                    <div className="flex items-center space-x-2 ml-1">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        {...register("rememberMe")}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="rememberMe"
                        className="text-xs font-medium text-slate-500 cursor-pointer"
                      >
                        จดจำฉันในระบบ
                      </label>
                    </div>
                  )}

                  {/* Confirm Password (Signup only) */}
                  {isSignUp && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label
                        htmlFor="confirmPassword"
                        className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-all duration-300">
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        </div>
                        <Input
                          {...register("confirmPassword")}
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          className={cn(
                            "pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/10 transition-all text-sm",
                            errors.confirmPassword &&
                              "border-red-500/50 focus:border-red-500",
                          )}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-[10px] text-red-500 ml-1 font-medium">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </m.div>
                  )}
                </div>

                {error && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-3 rounded-xl border transition-colors",
                      isLogin
                        ? "bg-red-50 border-red-100"
                        : "bg-red-500/10 border-red-500/20",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[13px] font-semibold flex items-center gap-2",
                        isLogin ? "text-red-600" : "text-red-400",
                      )}
                    >
                      <span
                        className={cn(
                          "shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-[8px]",
                          isLogin ? "bg-red-100" : "bg-red-500/20",
                        )}
                      >
                        ⚠️
                      </span>
                      {error}
                    </p>
                  </m.div>
                )}

                <div className="pt-2 ">
                  <Button
                    type="submit"
                    className={cn(
                      "w-full h-14  text-base font-bold shadow-2xl rounded-xl transition-all active:scale-[0.98]",
                      isLogin
                        ? "bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white"
                        : isSignUp
                          ? "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                          : "bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white",
                    )}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Please wait...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>
                          {isLogin
                            ? "Sign In"
                            : isSignUp
                              ? "Create Account"
                              : "Send Reset Link"}
                        </span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </span>
                    )}
                  </Button>

                  {isLogin && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        form.setValue("email", "demo@vccasset.com");
                        form.setValue("password", "Demo2026!");
                        toast.success("Logging in to Sandbox Demo...");
                        onFormSubmit({
                          email: "demo@vccasset.com",
                          password: "Demo2026!",
                          rememberMe: true,
                        });
                      }}
                      className="w-full mt-3 py-2.5 px-3 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <span>🧪</span>
                      <span>One-Click Sandbox Demo Login (demo@vccasset.com)</span>
                    </button>
                  )}
                </div>

                {/* Social Login Options - Hidden in Forgot View */}
                {!isForgot && <SocialAuthButtons isLogin={isLogin} />}

                <div className="text-center space-y-6 pt-4">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isLogin ? "text-slate-500" : "text-slate-500",
                    )}
                  >
                    {isForgot
                      ? "Remembered your password?"
                      : isLogin
                        ? "Don't have an account?"
                        : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() =>
                        handleSetView(
                          isForgot ? "login" : isLogin ? "signup" : "login",
                        )
                      }
                      className={cn(
                        "underline underline-offset-8 transition-all font-bold",
                        isLogin
                          ? "text-blue-600 hover:text-blue-700 decoration-blue-500/30"
                          : isSignUp
                            ? "text-purple-400 hover:text-purple-300 decoration-purple-500/30"
                            : "text-amber-400 hover:text-amber-300 decoration-amber-500/30",
                      )}
                    >
                      {isForgot
                        ? "Back to Sign In"
                        : isLogin
                          ? "Sign up here"
                          : "Sign in here"}
                    </button>
                  </p>

                  {/* PDPA Notice */}
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed opacity-70">
                    By signing in, you agree to our{" "}
                    <button
                      type="button"
                      className="underline hover:text-blue-500 transition-colors"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="underline hover:text-blue-500 transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full border transition-all",
                        isLogin
                          ? "bg-blue-50 border-blue-100"
                          : "bg-white/3 border-white/5",
                      )}
                    >
                      <BsShieldFillCheck
                        className={cn(
                          "h-3.5 w-3.5",
                          isLogin ? "text-blue-600" : "text-blue-500",
                        )}
                      />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        AES-256 Secure
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full border transition-all",
                        isLogin
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-white/3 border-white/5",
                      )}
                    >
                      <SiSupabase
                        className={cn(
                          "h-3.5 w-3.5",
                          isLogin ? "text-emerald-500" : "text-emerald-500",
                        )}
                      />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        Supabase Cloud
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </m.div>
        </AnimatePresence>
      </m.div>
    </PremiumAuthLayout>
  );
}
