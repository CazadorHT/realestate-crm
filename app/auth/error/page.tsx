"use client";

import { PremiumAuthLayout } from "@/components/auth/premium-auth-layout";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { Suspense, use } from "react";

function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = use(searchParams);

  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">
          {params?.error ? `รหัสข้อผิดพลาด: ${params.error}` : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"}
        </p>
        <p className="text-xs text-slate-500">
          ขออภัยในความไม่สะดวก กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <PremiumAuthLayout
      view="other"
      title={
        <div className="flex flex-col items-center text-center space-y-4 pb-1 pt-6 sm:pt-8">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] bg-red-500/10 border-red-500/20 text-red-400",
            )}
          >
            <AlertCircle className="h-3 w-3" />
            เกิดข้อผิดพลาด
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            อ๊ะ! มีบางอย่างผิดพลาด
          </h1>
        </div>
      }
    >
      <div className="space-y-6">
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <Suspense fallback={<div className="h-20 animate-pulse bg-white/5 rounded-xl" />}>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </m.div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            asChild
            variant="outline"
            className="h-14 text-sm font-bold rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Link href="/auth/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าหลัก
            </Link>
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="h-14 text-sm font-bold rounded-xl bg-linear-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            ลองใหม่
          </Button>
        </div>
      </div>
    </PremiumAuthLayout>
  );
}
