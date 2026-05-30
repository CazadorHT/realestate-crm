"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PremiumAuthLayout } from "@/components/auth/premium-auth-layout";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, ShieldAlert, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

function DataDeletionContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const confirmationCode = searchParams.get("code") || "N/A";

  return (
    <PremiumAuthLayout
      view="other"
      title={
        <div className="flex flex-col items-center text-center space-y-4 pb-1 pt-6 sm:pt-8">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] bg-rose-500/10 border-rose-500/20 text-rose-400",
            )}
          >
            <Trash2 className="h-3 w-3" />
            {t("auth.data_deletion.title")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {t("auth.data_deletion.title")}
          </h1>
          <p className="font-medium text-xs px-8 leading-relaxed text-slate-400">
            {t("auth.data_deletion.subtitle")}
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("auth.data_deletion.status_label")}
            </span>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider bg-emerald-400/10 py-2 px-4 rounded-full border border-emerald-400/20 w-fit">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{t("auth.data_deletion.status_pending")}</span>
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("auth.data_deletion.code_label")}
            </span>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-xs text-rose-300 break-all select-all">
              {confirmationCode}
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed text-sm pt-2">
            {t("auth.data_deletion.desc")}
          </p>
        </m.div>

        <Button
          asChild
          className="w-full h-14 text-base font-bold shadow-2xl rounded-xl transition-all active:scale-[0.98] bg-linear-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-white/10"
        >
          <Link href="/auth/login" className="flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("auth.data_deletion.back_to_login")}
          </Link>
        </Button>
      </div>
    </PremiumAuthLayout>
  );
}

export default function DataDeletionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
          <div className="animate-pulse text-sm">Loading...</div>
        </div>
      }
    >
      <DataDeletionContent />
    </Suspense>
  );
}
