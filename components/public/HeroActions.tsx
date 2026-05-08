"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const DepositWizard = dynamic(
  () =>
    import("@/components/public/deposit/DepositWizard").then(
      (mod) => mod.DepositWizard,
    ),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 animate-pulse font-medium">
          Loading Form...
        </p>
      </div>
    ),
  },
);

interface HeroActionsProps {
  t: {
    cta_deposit: string;
    success_title: string;
    success_message: string;
    close: string;
  };
}

export function HeroActions({ t }: HeroActionsProps) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isDepositSuccess, setIsDepositSuccess] = useState(false);

  return (
    <ResponsiveDialog
      open={isDepositOpen}
      onOpenChange={(open) => {
        setIsDepositOpen(open);
        if (!open) setIsDepositSuccess(false);
      }}
      trigger={
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:w-auto md:w-auto h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl bg-white/90 hover:bg-white! border-slate-200 text-slate-700 hover:text-blue-600! shadow-sm transition-all animate-in fade-in-0 duration-200 slide-in-from-bottom-2"
        >
          {t.cta_deposit}
        </Button>
      }
      className="sm:max-w-[720px] p-0 border-0 gap-0 rounded-3xl"
    >
      {isDepositSuccess ? (
        <div className="text-center py-20 px-6 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-linear-to-br from-green-50 to-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="h-12 w-12" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              {t.success_title}
            </h3>
            <p className="text-slate-500 text-base md:text-lg max-w-sm mx-auto">
              {t.success_message}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsDepositSuccess(false);
              setIsDepositOpen(false);
            }}
            className="mt-6 border-slate-200 hover:bg-slate-50 rounded-2xl px-12 py-7 text-base font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            {t.close}
          </Button>
        </div>
      ) : (
        <DepositWizard
          onSuccessAction={() => setIsDepositSuccess(true)}
          onCancelAction={() => setIsDepositOpen(false)}
          location="Hero Section"
        />
      )}
    </ResponsiveDialog>
  );
}
