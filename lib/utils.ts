import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_KEY;

import { format, formatDistanceToNow } from "date-fns";
import { th, enUS } from "date-fns/locale";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy");
}

export function formatDateThai(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, "d MMMM yyyy", { locale: th });
}

export function formatDistanceToNowThai(date: string | Date | null | undefined, isEn = false): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return isEn
    ? formatDistanceToNow(d, { addSuffix: true, locale: enUS })
    : formatDistanceToNow(d, { addSuffix: true, locale: th });
}

export function formatRelativeTime(date: string | Date | null | undefined, isEn = false): string {
  return formatDistanceToNowThai(date, isEn);
}

export function formatPercent(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

export function formatCurrency(amt: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amt);
}

export function formatTimeAgo(dateString: string | number | Date): string {
  const created = new Date(dateString);
  const diffMs = new Date().getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "เมื่อครู่นี้";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
  return formatDate(created);
}

export function formatTimeAgoEn(dateString: string | number | Date): string {
  const created = new Date(dateString);
  const diffMs = new Date().getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(created);
}

/**
 * Helper to get the base URL of the request dynamically.
 * Useful for OAuth redirects and absolute URL generation.
 */
export function getBaseUrl(request: Request) {
  // Always prefer the canonical app URL to avoid Vercel deployment URL mismatches
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }

  const host = request.headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";

  // Fallback for cases without Host header (e.g., Edge functions or background tasks)
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL || "https://vccasset.com";

  return `${protocol}://${host}`;
}
