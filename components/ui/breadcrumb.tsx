"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface BreadcrumbItem {
  label: string;
  href?: string; // if no href, it's the current page
  className?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  backHref?: string; // optional back button href
  backLabel?: string;
  variant?: "default" | "on-dark";
  className?: string;
}

export function Breadcrumb({
  items,
  backHref,
  backLabel,
  variant = "default",
  className,
}: BreadcrumbProps) {
  const { t } = useLanguage();
  const isOnDark = variant === "on-dark";
  const effectiveBackLabel = backLabel || t("common.back");

  return (
    <nav
      className={cn(
        // Responsive: smaller gap on mobile, larger on tablet/desktop
        "flex items-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm",
        isOnDark ? "text-white/70" : "text-muted-foreground",
        className,
      )}
      aria-label="Breadcrumb"
    >
      {/* Back Button - smaller on mobile */}
      {backHref && (
        <>
          <Link
            href={backHref}
            className={cn(
              // Responsive button size
              "flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full border border-slate-200 text-slate-500 transition-colors shadow-sm shrink-0",
              isOnDark
                ? "bg-white/10 text-white/60 border-white/10 hover:bg-white hover:text-slate-900"
                : "bg-white hover:bg-slate-600 hover:text-white hover:border-slate-600",
            )}
            title={effectiveBackLabel}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </>
      )}

      {/* Breadcrumb Items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <span
            key={index}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0",
              // On mobile, hide middle items if there are more than 2 items
              items.length > 2 && !isFirst && !isLast && "hidden sm:flex",
            )}
          >
            {/* Show ellipsis on mobile for hidden items */}
            {items.length > 2 && isLast && (
              <span className="flex items-center gap-1 sm:hidden">
                <span className="text-muted-foreground/50">...</span>
                <ChevronRight
                  className={cn(
                    "h-3 w-3 flex-none",
                    isOnDark ? "text-white/40" : "text-muted-foreground/50",
                  )}
                />
              </span>
            )}

            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={cn(
                  "transition-colors whitespace-nowrap truncate max-w-[80px] sm:max-w-[120px] md:max-w-none",
                  isOnDark ? "hover:text-white" : "hover:text-primary",
                  item.className,
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "font-medium truncate max-w-[100px] sm:max-w-[150px] md:max-w-[250px] lg:max-w-none",
                  isOnDark ? "text-white" : "text-slate-900",
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
                  "h-3 w-3 sm:h-3.5 sm:w-3.5 flex-none",
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
