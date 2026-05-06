"use client";

import { LucideIcon, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";

interface DashboardEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}

export function DashboardEmptyState({
  icon: Icon = SearchX,
  title,
  description,
  className,
  action,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500",
        className
      )}
    >
      <div className="relative mb-6">
        {/* Decorative Background Glow */}
        <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-20 scale-150 animate-pulse" />
        
        {/* Icon Container with Floating Animation */}
        <m.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-xs"
        >
          <Icon className="w-10 h-10 text-slate-400 opacity-80" strokeWidth={1.5} />
          
          {/* Accent dot */}
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        </m.div>
      </div>

      <div className="max-w-[280px] space-y-2">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed opacity-70">
          {description}
        </p>
      </div>

      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
