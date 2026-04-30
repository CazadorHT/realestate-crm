"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
}

export function GuidedTour({ 
  tourId, 
  steps, 
  onComplete, 
  autoStartDelay = 1500,
  showHelpButton = true 
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const storageKey = `cazador_tour_${tourId}_seen`;

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour) {
      const timer = setTimeout(() => setCurrentStep(0), autoStartDelay);
      return () => clearTimeout(timer);
    } else {
      setIsCompleted(true);
    }
  }, [storageKey, autoStartDelay]);

  const updateTargetRect = useCallback(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      const element = document.getElementById(step.targetId);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        // Scroll to element if needed
        const rect = element.getBoundingClientRect();
        const isInViewport = 
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);
        
        if (!isInViewport) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
        // Wait for potential UI transitions (like drawer opening)
        setTimeout(updateTargetRect, 300);
      } else {
        updateTargetRect();
      }
    }
  }, [currentStep, steps, updateTargetRect]);
  useEffect(() => {
    const handleEvents = () => {
      // Small delay to ensure layout has settled
      requestAnimationFrame(updateTargetRect);
    };
    window.addEventListener("resize", handleEvents);
    window.addEventListener("scroll", handleEvents);
    return () => {
      window.removeEventListener("resize", handleEvents);
      window.removeEventListener("scroll", handleEvents);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(-1);
    setIsCompleted(true);
    localStorage.setItem(storageKey, "true");
    if (onComplete) onComplete();
  };

  const restartTour = () => {
    setIsCompleted(false);
    setCurrentStep(0);
  };

  if (currentStep === -1 && isCompleted) {
    if (!showHelpButton) return null;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={restartTour}
        className="fixed bottom-4 right-4 z-40 gap-2 rounded-full shadow-lg border-blue-100 bg-white/80 backdrop-blur-sm text-blue-600 hover:bg-blue-50"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="text-xs font-bold">Tutorial</span>
      </Button>
    );
  }

  if (currentStep === -1) return null;

  const step = steps[currentStep];

  // Dynamic positioning logic
  const getPositionStyles = () => {
    if (!targetRect) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    
    const spacing = 20;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const tooltipWidth = isMobile ? Math.min(window.innerWidth - 40, 380) : 380;
    
    let top = targetRect.bottom + spacing;
    let left = targetRect.left + targetRect.width / 2;

    // Check if it's cutting off at the bottom
    if (top + 200 > window.innerHeight) {
      top = targetRect.top - 200 - spacing;
    }

    // Keep within horizontal bounds
    const halfWidth = tooltipWidth / 2;
    if (left - halfWidth < 20) left = halfWidth + 20;
    if (left + halfWidth > window.innerWidth - 20) left = window.innerWidth - halfWidth - 20;

    return {
      top,
      left,
      transform: "translateX(-50%)",
      position: "absolute" as const,
      width: isMobile ? "calc(100vw - 40px)" : "380px"
    };
  };

  return (
    <div className="fixed inset-0 z-100 pointer-events-none overflow-hidden">
      {/* Overlay with Mask */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] pointer-events-auto"
        onClick={handleComplete}
        style={{
          maskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black ${Math.max(targetRect.width, targetRect.height) / 1.5 + 20}px)` : 'none',
          WebkitMaskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black ${Math.max(targetRect.width, targetRect.height) / 1.5 + 20}px)` : 'none',
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={getPositionStyles()}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="pointer-events-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="h-1.5 w-full bg-slate-100">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">
                    Step {currentStep + 1} of {steps.length}
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
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleComplete}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl shadow-lg shadow-blue-200"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        Done
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Arrow pointing to target */}
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-blue-100 rotate-45"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
