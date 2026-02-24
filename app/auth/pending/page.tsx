"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { AuthLayout } from "@/components/auth-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PendingApprovalPage() {
  const { t } = useLanguage();

  return (
    <AuthLayout
      greeting={<>{t("auth.pending.title")}</>}
      subtitle={t("auth.pending.subtitle")}
      features={[
        t("trust.verified_title"),
        t("trust.safe_title"),
        t("trust.service_title"),
      ]}
    >
      <div className="flex flex-col gap-6">
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-amber-50 rounded-full animate-pulse">
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t("auth.pending.title")}
            </CardTitle>
            <CardDescription className="text-base font-medium text-slate-600">
              {t("auth.pending.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-600 leading-relaxed text-sm">
                {t("auth.pending.description")}
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600 font-medium text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>{t("auth.pending.notice")}</span>
              </div>
            </div>

            <Button
              asChild
              className="w-full h-12 text-base font-medium bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.pending.back_to_login")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
