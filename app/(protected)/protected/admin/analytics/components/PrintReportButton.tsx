"use client";

import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/language-context";

export function PrintReportButton() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    toast.info(isEn ? "Preparing PDF report..." : "กำลังจัดเตรียมรายงาน PDF...", { icon: <Printer className="h-4 w-4" /> });
    
    // Brief delay to ensure UI handles the print state if needed
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={isPrinting}
      className="flex items-center justify-center gap-2 w-full md:w-auto bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all font-medium py-1.5 h-12 rounded-xl shadow-sm"
    >
      {isPrinting ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      ) : (
        <Printer className="h-4 w-4 text-blue-500" />
      )}
      <span className="hidden md:block">{isEn ? "Print PDF" : "พิมพ์รายงาน PDF"}</span>
    </Button>
  );
}

