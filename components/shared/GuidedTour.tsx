"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateTooltipPosition } from "@/lib/tour-utils";

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  onEnter?: () => void;
}

interface GuidedTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  autoStartDelay?: number;
  showHelpButton?: boolean;
  lifted?: boolean;
}

export function GuidedTour({
  tourId,
  steps,
  onComplete,
  autoStartDelay = 500,
  showHelpButton = true,
  lifted = false,
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [tooltipSide, setTooltipSide] = useState<
    "top" | "bottom" | "left" | "right"
  >("bottom");
  const [mounted, setMounted] = useState(false);
  const [isAnyDialogOpen, setIsAnyDialogOpen] = useState(false);

  const storageKey = `cazador_tour_${tourId}_seen`;

  useEffect(() => {
    setMounted(true);
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour) {
      const timer = setTimeout(() => setCurrentStep(0), autoStartDelay);
      return () => clearTimeout(timer);
    } else {
      setIsCompleted(true);
    }
  }, [storageKey, autoStartDelay]);

  // Detect if any dialog/drawer is open to hide the tutorial button
  useEffect(() => {
    const checkDialogs = () => {
      // Look for standard Radix/Shadcn dialogs or drawers
      const dialogs = document.querySelectorAll(
        '[role="dialog"], [data-state="open"]',
      );
      // Filter out our own tour overlay if needed, but it has z-index/pointer-events handles
      setIsAnyDialogOpen(dialogs.length > 0);
    };

    const observer = new MutationObserver(checkDialogs);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial check
    checkDialogs();

    return () => observer.disconnect();
  }, []);

  const updateTargetRect = useCallback(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const element = document.getElementById(steps[currentStep].targetId);
      if (element) {
        // Always scroll to center for better visibility and consistent experience
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        // Wait slightly longer for smooth scroll to finish or settle
        setTimeout(() => {
          if (element) setTargetRect(element.getBoundingClientRect());
        }, 500);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step.onEnter) {
        step.onEnter();
        setTimeout(updateTargetRect, 100);
      } else {
        updateTargetRect();
      }
    }
  }, [currentStep, steps, updateTargetRect]);

  useEffect(() => {
    const handle = () => requestAnimationFrame(updateTargetRect);
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((p) => p + 1);
    else handleComplete();
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };
  const handleComplete = () => {
    setCurrentStep(-1);
    setIsCompleted(true);
    localStorage.setItem(storageKey, "true");
    if (onComplete) onComplete();
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentStep === -1) return;

      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, handleNext, handleBack, handleComplete]);

  const restartTour = () => {
    setIsCompleted(false);
    setCurrentStep(0);
  };

  const getAnimate = () => {
    if (!targetRect || typeof window === "undefined") {
      return {
        opacity: 0, // Hidden while in center to prevent "floating" jump
        scale: 0.9,
        x: "-50%",
        y: "-50%",
        top: "50%",
        left: "50%",
      };
    }
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      return {
        opacity: 1,
        y: 0,
        x: 0,
        bottom: lifted ? 100 : 24, // Conditional lift
        top: "auto",
        left: 0,
        scale: 1,
      };
    }

    const pos = calculateTooltipPosition(
      targetRect,
      window.innerWidth,
      window.innerHeight,
      isMobile,
    );
    if (pos.side !== tooltipSide) setTooltipSide(pos.side);
    return {
      opacity: 1,
      scale: 1,
      top: pos.top,
      left: pos.left,
      x: "-50%",
      y: 0,
    };
  };

  const getStyle = (): React.CSSProperties => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile) {
      return {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        padding: lifted ? "0 16px 100px 16px" : "0 16px 24px 16px",
        zIndex: 100000,
      };
    }
    return {
      position: "fixed",
      width: "380px",
      zIndex: 100000,
    };
  };

  if (!mounted) return null;

  const step = steps[currentStep];

  return createPortal(
    <>
      {currentStep === -1 &&
        isCompleted &&
        showHelpButton &&
        !isAnyDialogOpen && (
          <Button
            variant="outline"
            size="icon"
            onClick={restartTour}
            style={{ zIndex: 10001 }}
            className={cn(
              "fixed right-6 sm:right-6 h-10 w-10 sm:h-10 sm:w-10 flex items-center justify-center rounded-full shadow-xl border border-slate-100 bg-white text-blue-600! hover:scale-110 hover:bg-blue-50 transition-all duration-300 pointer-events-auto",
              lifted ? "bottom-24" : "bottom-18",
            )}
          >
            <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
        )}

      {currentStep !== -1 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div
            className="absolute inset-0 bg-transparent pointer-events-auto cursor-pointer"
            onClick={handleComplete}
          />
          {targetRect ? (
            <div
              className="pointer-events-none"
              style={{
                position: "fixed",
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                borderRadius: "10px",
                boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.72)",
                zIndex: 9999,
              }}
            />
          ) : (
            <div
              className="absolute inset-0 bg-slate-900/70 pointer-events-none"
              style={{ zIndex: 9999 }}
            />
          )}

          <AnimatePresence mode="wait">
            <m.div
              key={currentStep}
              initial={
                typeof window !== "undefined" && window.innerWidth < 640
                  ? { y: "100%", opacity: 0 }
                  : { scale: 0.9, opacity: 0 }
              }
              animate={getAnimate()}
              exit={
                typeof window !== "undefined" && window.innerWidth < 640
                  ? { y: "100%", opacity: 0 }
                  : { scale: 0.9, opacity: 0 }
              }
              transition={{
                y: { type: "spring", damping: 25, stiffness: 400 },
                scale: { type: "spring", damping: 25, stiffness: 600 },
                opacity: { duration: 0.1 },
                default: { duration: 0 },
              }}
              style={getStyle()}
              className="pointer-events-auto"
            >
              <div
                className={cn(
                  "bg-white shadow-2xl border-blue-100 overflow-hidden",
                  "sm:rounded-2xl sm:border",
                  "rounded-2xl border", // Floating card style for mobile
                )}
              >
                {/* Mobile Handle - Subtle indicator */}
                <div className="sm:hidden flex justify-center pt-2">
                  <div className="w-8 h-1 bg-slate-100 rounded-full" />
                </div>

                <div className="h-1.5 w-full bg-slate-100">
                  <m.div
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentStep + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">
                        ขั้นตอนที่ {currentStep + 1} จาก {steps.length}
                      </span>
                    </div>
                    <button
                      onClick={handleComplete}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {step.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="text-slate-400 hover:text-slate-600 font-bold px-2"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      ย้อนกลับ
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleComplete}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ข้าม
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleNext}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl shadow-lg shadow-blue-200"
                      >
                        {currentStep === steps.length - 1 ? (
                          <>
                            <span>เสร็จสิ้น</span>
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                          </>
                        ) : (
                          <>
                            <span>ถัดไป</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {typeof window !== "undefined" && window.innerWidth >= 640 && (
                <div
                  className={cn(
                    "absolute w-4 h-4 bg-white rotate-45 border-blue-100",
                    tooltipSide === "top" &&
                      "left-1/2 -translate-x-1/2 -bottom-2 border-b border-r",
                    tooltipSide === "bottom" &&
                      "left-1/2 -translate-x-1/2 -top-2 border-t border-l",
                    tooltipSide === "right" &&
                      "top-1/2 -translate-y-1/2 -left-2 border-b border-l",
                    tooltipSide === "left" &&
                      "top-1/2 -translate-y-1/2 -right-2 border-t border-r",
                  )}
                />
              )}
            </m.div>
          </AnimatePresence>
        </div>
      )}
    </>,
    document.body,
  );
}
