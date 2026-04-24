"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { BiRefresh } from "react-icons/bi";
import Link from "next/link";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="py-20 px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
        <HiOutlineExclamationCircle size={40} className="text-rose-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {t("error_boundary.title")}
      </h1>
      <p className="text-slate-500 max-w-md mx-auto mb-8">
        {t("error_boundary.description")}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-semibold gap-2"
        >
          <BiRefresh size={20} />
          {t("error_boundary.retry")}
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 px-8 rounded-xl font-semibold border-slate-200"
        >
          <Link href="/properties">
            {t("error_boundary.view_all")}
          </Link>
        </Button>
      </div>

      <p className="mt-12 text-[10px] text-slate-400 font-mono">
        ID: {error.digest || "N/A"}
      </p>
    </div>
  );
}
