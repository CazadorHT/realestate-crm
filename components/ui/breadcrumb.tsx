"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string; // if no href, it's the current page
  className?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  backHref?: string; // optional back button href
  backLabel?: string; // default: "ย้อนกลับ"
  variant?: "default" | "on-dark";
  className?: string;
}

export function Breadcrumb({
  items,
  backHref,
  backLabel = "ย้อนกลับ",
  variant = "default",
  className,
}: BreadcrumbProps) {
  const isOnDark = variant === "on-dark";

  return (
    <nav
      className={cn(
        "flex items-center gap-3 text-sm",
        isOnDark ? "text-white/70" : "text-muted-foreground",
        className,
      )}
      aria-label="Breadcrumb"
    >
      {/* Back Button */}
      {backHref && (
        <>
          <Link
            href={backHref}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 text-slate-500 transition-colors shadow-sm",
              isOnDark
                ? "bg-white/10 text-white/60 border-white/10 hover:bg-white hover:text-slate-900"
                : "bg-white hover:bg-slate-600 hover:text-white hover:border-slate-600",
            )}
            title={backLabel}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </>
      )}

      {/* Breadcrumb Items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-2 overflow-hidden">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={cn(
                  "transition-colors whitespace-nowrap",
                  isOnDark ? "hover:text-white" : "hover:text-primary",
                  item.className,
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "font-medium",
                  isOnDark ? "text-white" : "text-foreground",
                  item.className,
                )}
                title={item.label} // tooltip for truncated text
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 flex-none",
                  isOnDark ? "text-white/40" : "text-muted-foreground/50",
                )}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
