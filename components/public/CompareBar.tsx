"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearCompare, readCompareIds } from "@/lib/compare-store";

export function CompareBar() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readCompareIds());

    const onStorage = () => setIds(readCompareIds());
    // Listen for both cross-tab storage changes and local custom events
    window.addEventListener("storage", onStorage);
    window.addEventListener("compare-updated", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("compare-updated", onStorage);
    };
  }, []);

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <div className="max-w-screen-md mx-auto rounded-3xl border border-slate-200 bg-white shadow-xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Scale className="h-4 w-4" />
          </div>
          เลือกเพื่อเปรียบเทียบ: {ids.length}/3
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10"
            onClick={() => {
              clearCompare();
              setIds([]);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            ล้าง
          </Button>

          <Button asChild className="h-10">
            <Link href={`/compare?ids=${ids.join(",")}`}>เปรียบเทียบ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
