import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_KEY;

import { format } from "date-fns";
import { th } from "date-fns/locale";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  // Project-wide format: dd/MM/yyyy with Buddhist Year adjustment if needed?
  // Usually "dd/MM/yyyy" implies Christian Era.
  // But th locale might default to BE?
  // Let's stick to Christian Year "yyyy" first unless specified.
  // Actually, standard Thai business usage often mixes.
  // But let's use "dd/MM/yyyy" as requested.
  return format(d, "dd/MM/yyyy");
}

export function formatDateThai(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, "d MMMM yyyy", { locale: th });
}

export function formatPercent(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

export function formatTimeAgo(dateString: string): string {
  const created = new Date(dateString);
  const diffMs = new Date().getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "เมื่อครู่นี้";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
  return formatDate(dateString);
}
