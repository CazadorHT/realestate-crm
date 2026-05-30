"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeroActionsProps {
  t: {
    cta_deposit: string;
    success_title: string;
    success_message: string;
    close: string;
  };
}

export function HeroActions({ t }: HeroActionsProps) {
  return (
    <Link href="/deposit" className="w-full sm:w-auto">
      <Button
        size="lg"
        variant="outline"
        className="w-full sm:w-auto md:w-auto h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-xl bg-white/90 hover:bg-white! border-slate-200 text-slate-700 hover:text-blue-600! shadow-sm transition-all animate-in fade-in-0 duration-200 slide-in-from-bottom-2"
      >
        {t.cta_deposit}
      </Button>
    </Link>
  );
}
