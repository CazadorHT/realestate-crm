"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useAITranslation } from "../hooks/use-ai-translation";

interface AiWriterButtonProps {
  className?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg";
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
}

export function AiWriterButton({
  className,
  variant = "outline",
  size = "sm",
  onClick,
  disabled,
}: AiWriterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isTranslatingAll, generateAndTranslateAll } = useAITranslation();

  const handleStart = async () => {
    setIsOpen(false);
    if (onClick) {
      await onClick();
    } else {
      await generateAndTranslateAll();
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={variant}
              size={size}
              onClick={() => setIsOpen(true)}
              disabled={disabled || isTranslatingAll}
              className={cn(
                "gap-2 border-amber-200 text-amber-600! bg-amber-50 hover:bg-amber-100 rounded-xl font-medium transition-all active:scale-95",
                className,
              )}
            >
              {isTranslatingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-500" />
              )}
              AI แต่งคำบรรยาย ✨
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white z-102 border-none shadow-xl px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>
                AI Writer: ให้ AI ช่วยแต่งคำบรรยาย'ทุกภาษา' ให้น่าสนใจและเป็นมืออาชีพ ✨
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ResponsiveDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>AI Writer อัจฉริยะ ✨</span>
          </div>
        }
        description="ช่วยคุณแต่งคำบรรยายประกาศให้น่าสนใจและเป็นมืออาชีพในพริบตา"
        className="sm:max-w-md"
      >
        <div className="space-y-6 py-4">
          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex gap-4">
            <div className="p-2 bg-blue-100 rounded-full h-fit">
              <Info className="h-5 w-5 text-blue-600 shrink-0" />
            </div>
            <div className="text-sm text-blue-800 leading-relaxed">
              <p className="font-bold mb-1 text-base text-blue-900">
                คำแนะนำก่อนเริ่ม:
              </p>
              กรุณาลงข้อมูลทรัพย์สินให้ครบถ้วนก่อนในสเต็ปที่ 1 และ 2 (เช่น ราคา,
              ขนาดพื้นที่, จุดเด่น) เพื่อให้ AI
              สามารถนำข้อมูลไปแต่งคำบรรยายได้อย่างละเอียดและแม่นยำที่สุดครับ
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-700">
            <Button
              className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-200 gap-2"
              onClick={handleStart}
            >
              <Sparkles className="w-5 h-5" />
              เริ่มการแต่งคำบรรยายทันที
            </Button>
            <Button
              variant="ghost"
              className="w-full h-12 rounded-xl text-slate-500 font-medium"
              onClick={() => setIsOpen(false)}
            >
              ไว้ทำภายหลัง
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}
