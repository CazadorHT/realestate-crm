"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Check, X, ChevronRight, ChevronLeft } from "lucide-react";
import { FaPaperPlane } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AnimatedSend } from "@/components/common/animated-icons";
import { cn } from "@/lib/utils";

// ── Submit Button ──
export function SubmitButton({
  compact,
  isLoading,
  title,
}: {
  compact?: boolean;
  isLoading?: boolean;
  title?: string;
}) {
  const { t } = useLanguage();

  return (
    <Button
      type="submit"
      disabled={isLoading}
      className={`w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_6px_15px_-4px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_10px_20px_-6px_rgba(37,99,235,0.5)] active:opacity-90 font-semibold h-10 rounded-xl text-xs ${
        compact ? "" : ""
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          {t("property.contact_dialog.sending") || "กำลังส่ง..."}
        </>
      ) : (
        <>
          <AnimatedSend size={15} className="mr-1.5" />
          {title || t("property.contact_dialog.submit") || "ส่งข้อมูล"}
        </>
      )}
    </Button>
  );
}

import { motion, AnimatePresence } from "framer-motion";

// ── Step Indicator Icon (Enhanced) ──
export function StepIcon({
  stepNum,
  currentStep,
  isDesktop = false,
}: {
  stepNum: number;
  currentStep: number;
  isDesktop?: boolean;
}) {
  const isCompleted = currentStep > stepNum;
  const isActive = currentStep === stepNum;
  const sizeClass = isDesktop ? "w-9 h-9" : "w-7 h-7";
  const iconSize = isDesktop ? 18 : 14;

  return (
    <div className={cn("relative flex items-center justify-center", sizeClass)}>
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "absolute inset-0 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20",
              sizeClass,
            )}
          >
            <Check
              className="text-white"
              size={iconSize}
              strokeWidth={3}
            />
          </motion.div>
        ) : isActive ? (
          <motion.div
            key="active"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn(
              "absolute inset-0 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/10",
              sizeClass,
            )}
          >
            <span
              className={cn(
                "font-bold text-white",
                isDesktop ? "text-sm" : "text-[10px]",
              )}
            >
              {stepNum}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "absolute inset-0 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/60",
              sizeClass,
            )}
          >
            <span
              className={cn(
                "font-bold text-slate-400",
                isDesktop ? "text-sm" : "text-[10px]",
              )}
            >
              {stepNum}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
