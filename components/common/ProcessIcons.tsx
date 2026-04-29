"use client";

import { m, Variants } from "framer-motion";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Activity,
  History,
  Trash2,
  LucideProps
} from "lucide-react";
import { cn } from "@/lib/utils";

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => {
    const delay = 1 + i * 0.5;
    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
        opacity: { delay, duration: 0.01 }
      }
    };
  }
};

export function AnimatedCheck({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <m.div
      initial="hidden"
      animate="visible"
      className={className}
    >
      <CheckCircle2 size={size} />
    </m.div>
  );
}

export function AnimatedAlert({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <m.div
      initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: 1,
        rotate: 0
      }}
      transition={{ 
        scale: { repeat: Infinity, duration: 2 },
        duration: 0.5 
      }}
      className={cn("text-red-500", className)}
    >
      <AlertCircle size={size} />
    </m.div>
  );
}

export function AnimatedLoader({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <m.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      className={cn("text-blue-500", className)}
    >
      <Loader2 size={size} />
    </m.div>
  );
}

export function AnimatedActivity({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <m.div
      animate={{ 
        opacity: [0.4, 1, 0.4],
        scale: [0.95, 1.05, 0.95]
      }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className={cn("text-slate-300", className)}
    >
      <Activity size={size} />
    </m.div>
  );
}
