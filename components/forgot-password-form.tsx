"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";

export function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : t("auth.errors.generic_error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      greeting={<>{t("auth.forgot_password.title")}</>}
      subtitle={t("auth.forgot_password.subtitle")}
      features={[
        t("trust.verified_title"),
        t("trust.safe_title"),
        t("trust.service_title"),
      ]}
    >
      <div className="flex flex-col gap-6">
        {success ? (
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-green-600">
                {t("auth.forgot_password.success_title")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("auth.forgot_password.success_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setSuccess(false)}
                className="w-full h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
              </Button>
              <div className="text-center pt-2 border-t border-slate-200">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {t("auth.forgot_password.back_to_login")}
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t("auth.forgot_password.title")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("auth.forgot_password.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t("auth.forgot_password.email_label")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 flex items-center gap-2">
                        <span className="text-red-500">⚠️</span>
                        {error}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("auth.forgot_password.sending")}
                      </span>
                    ) : (
                      t("auth.forgot_password.submit_btn")
                    )}
                  </Button>

                  <div className="text-center pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      {t("auth.signup.have_account")}{" "}
                      <Link
                        href="/auth/login"
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        {t("auth.signup.login")}
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Help Text */}
            <p className="text-center text-sm text-slate-500">
              {t("contact.sidebar_quick_title")}{" "}
              <Link
                href={`mailto:${siteConfig.contact.email}`}
                className="text-blue-600 hover:underline"
              >
                {t("contact.title")}
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
