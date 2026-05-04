"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PremiumAuthLayout } from "@/components/auth/premium-auth-layout";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const { t } = useLanguage();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let channel: import("@supabase/supabase-js").RealtimeChannel | undefined;
    let isSubscribed = true;

    const setupRealtime = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isSubscribed) return;

        // 1. Initial check
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (isSubscribed && profile && profile.role !== "USER") {
          router.push("/protected");
          return;
        }

        // 2. Subscribe to Realtime
        channel = supabase
          .channel(`profile-updates-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              if (!isSubscribed) return;
              console.log("[REALTIME] Profile updated:", payload);
              
              // Safely extract the new role from the payload
              const newRole = (payload.new as { role?: string }).role;
              if (newRole && newRole !== "USER") {
                router.push("/protected");
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("[PENDING] Error setting up realtime:", err);
      }
    };

    setupRealtime();

    return () => {
      isSubscribed = false;
      if (channel) supabase.removeChannel(channel);
    };
    // Removed supabase and router from dependencies to prevent re-runs
    // since they are stable in the context of this page.
  }, []); 

  return (
    <PremiumAuthLayout
      view="other"
      title={
        <div className="flex flex-col items-center text-center space-y-4 pb-1 pt-6 sm:pt-8">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] bg-amber-500/10 border-amber-500/20 text-amber-400",
            )}
          >
            <Clock className="h-3 w-3" />
            {t("auth.pending.title")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            รอการอนุมัติ
          </h1>
          <p className="font-medium text-xs px-8 leading-relaxed text-slate-400">
            {t("auth.pending.subtitle")}
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
          <p className="text-slate-300 leading-relaxed text-sm text-center">
            {t("auth.pending.description")}
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-[10px] uppercase tracking-wider bg-amber-400/10 py-2 px-4 rounded-full border border-amber-400/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{t("auth.pending.notice")}</span>
          </div>
        </m.div>

        <Button
          asChild
          className="w-full h-14 text-base font-bold shadow-2xl rounded-xl transition-all active:scale-[0.98] bg-linear-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-white/10"
        >
          <Link href="/auth/login" className="flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("auth.pending.back_to_login")}
          </Link>
        </Button>
      </div>
    </PremiumAuthLayout>
  );
}
