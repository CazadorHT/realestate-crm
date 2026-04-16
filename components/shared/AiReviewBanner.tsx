import React from "react";
import { Sparkles, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiReviewBannerProps {
  onConfirm?: () => void;
  isVerifying?: boolean;
  className?: string;
  type?: "property" | "blog";
}

export function AiReviewBanner({
  onConfirm,
  isVerifying,
  className,
  type = "property",
}: AiReviewBannerProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-50 mb-6 w-full animate-in slide-in-from-top duration-500",
        className
      )}
    >
      <div className="bg-amber-50 border-b border-amber-200/60 backdrop-blur-md px-4 py-3 sm:px-6 shadow-sm overflow-hidden relative">
        {/* Decorative Background Icon */}
        <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-100/50 -rotate-12 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shadow-sm border border-amber-200/50">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-sm sm:text-base flex items-center gap-2">
                ⚠️ {type === "property" ? "ข้อมูลรอการตรวจสอบความถูกต้อง" : "เนื้อหาบล็อกรอการตรวจสอบ"}
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-amber-200/50 text-amber-700 text-[10px] rounded-full font-bold uppercase tracking-wider">
                  AI Generated
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800/70 font-medium leading-relaxed max-w-2xl">
                {type === "property" 
                  ? "ทรัพย์สินนี้มีการใช้ AI ช่วยสร้างรายละเอียดหรือแปลภาษา ระบบจะบังคับเป็นแบบร่าง (Draft) จนกว่าแอดมินจะกดยืนยัน"
                  : "บทความนี้มีการใช้ AI สร้างเนื้อหาหรือแปลภาษา กรุณาตรวจสอบความถูกต้องและสำนวนก่อนเผยแพร่จริง"}
              </p>
            </div>
          </div>
          
          {onConfirm && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={isVerifying}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-amber-200 transition-all hover:scale-105 active:scale-95 group"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>ตรวจสอบและยืนยันแล้ว</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
