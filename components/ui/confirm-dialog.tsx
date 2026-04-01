"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
  trigger?: ReactNode;
  confirmDisabled?: boolean;
}

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ConfirmDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  title = "ยืนยันการทำรายการ",
  description = "คุณแน่ใจหรือไม่ที่จะทำรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  onConfirm,
  variant = "default",
  trigger,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const finalTitle =
    title === "ยืนยันการทำรายการ" ? t("common.confirm") : title;
  const finalDescription =
    description ===
    "คุณแน่ใจหรือไม่ที่จะทำรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
      ? t("common.are_you_sure")
      : description;
  const finalConfirmText =
    confirmText === "ยืนยัน" ? t("common.confirm") : confirmText;
  const finalCancelText =
    cancelText === "ยกเลิก" ? t("common.cancel") : cancelText;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
    try {
      await onConfirm();
      setIsSuccess(true);
      // Wait for success animation
      await new Promise((resolve) => setTimeout(resolve, 600));
      onOpenChange(false);
      // Reset success state for future reuse
      setTimeout(() => setIsSuccess(false), 300);
    } catch (err) {
      console.error("ConfirmDialog Error:", err);
      setIsConfirming(false);
    } finally {
      // Don't set isConfirming(false) here because we might be in success state
      if (!isSuccess) setIsConfirming(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title={finalTitle}
      description={finalDescription}
      trigger={trigger}
      className={cn(
        "sm:max-w-md",
        variant === "destructive" && "border-red-100"
      )}
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="outline"
            disabled={isConfirming || isSuccess}
            className="w-full sm:flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-medium"
            onClick={() => onOpenChange(false)}
          >
            {finalCancelText}
          </Button>
          <Button
            disabled={isConfirming || isSuccess || confirmDisabled}
            className={cn(
              "w-full sm:flex-1 h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 gap-2",
              isSuccess 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100"
                : variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-100"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-100"
            )}
            onClick={handleConfirm}
          >
            <AnimatePresence mode="wait">
              {isConfirming ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                </motion.div>
              ) : isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                   {finalConfirmText}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      }
    />
  );
}
