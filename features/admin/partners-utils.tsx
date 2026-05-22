import React from "react";

/**
 * Pure function to calculate new sort orders for a list of partners
 */
export function calculateNewSortOrders(partners: { id: string, sort_order: number | null }[]) {
  return partners.map((p, index) => {
    const newOrder = index + 1;
    if (p.sort_order !== newOrder) {
      return { id: p.id, sort_order: newOrder };
    }
    return null;
  }).filter((p): p is { id: string, sort_order: number } => p !== null);
}

export interface ChannelStyle {
  bg: string;
  text: string;
  border: string;
  hover: string;
  iconBg: string;
  iconColor: string;
  iconKey: "facebook" | "instagram" | "tiktok" | "livinginsider" | "website" | "default";
}

export function getChannelStyle(name: string): ChannelStyle {
  const normalized = name.toLowerCase().trim();
  
  if (normalized.includes("facebook") || normalized.includes("เฟส") || normalized.includes("fb")) {
    return {
      bg: "bg-blue-50/80 dark:bg-blue-950/20",
      text: "text-blue-600 dark:text-blue-400 font-medium",
      border: "border-blue-200/60 dark:border-blue-900/40",
      hover: "hover:border-blue-400 hover:bg-blue-100/40 hover:shadow-xs transition-all duration-200",
      iconBg: "bg-blue-600",
      iconColor: "text-white",
      iconKey: "facebook",
    };
  }
  
  if (normalized.includes("instagram") || normalized.includes("ไอจี") || normalized.includes("ig")) {
    return {
      bg: "bg-pink-50/80 dark:bg-pink-950/20",
      text: "text-pink-600 dark:text-pink-400 font-medium",
      border: "border-pink-200/60 dark:border-pink-900/40",
      hover: "hover:border-pink-400 hover:bg-pink-100/40 hover:shadow-xs transition-all duration-200",
      iconBg: "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600",
      iconColor: "text-white",
      iconKey: "instagram",
    };
  }
  
  if (normalized.includes("tiktok") || normalized.includes("ติ๊กต๊อก") || normalized.includes("ติ๊กตอก")) {
    return {
      bg: "bg-zinc-50 dark:bg-zinc-900/80",
      text: "text-zinc-900 dark:text-zinc-100 font-medium",
      border: "border-zinc-200 dark:border-zinc-800",
      hover: "hover:border-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:shadow-xs transition-all duration-200",
      iconBg: "bg-black dark:bg-white",
      iconColor: "text-white dark:text-black",
      iconKey: "tiktok",
    };
  }
  
  if (normalized.includes("livinginsider") || normalized.includes("living") || normalized.includes("ลิฟวิ่ง") || normalized.includes("insider")) {
    return {
      bg: "bg-orange-50/80 dark:bg-orange-950/20",
      text: "text-orange-600 dark:text-orange-400 font-medium",
      border: "border-orange-200/60 dark:border-orange-900/40",
      hover: "hover:border-orange-400 hover:bg-orange-100/40 hover:shadow-xs transition-all duration-200",
      iconBg: "bg-orange-500",
      iconColor: "text-white",
      iconKey: "livinginsider",
    };
  }
  
  return {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/20",
    text: "text-emerald-600 dark:text-emerald-400 font-medium",
    border: "border-emerald-200/60 dark:border-emerald-900/40",
    hover: "hover:border-emerald-400 hover:bg-emerald-100/40 hover:shadow-xs transition-all duration-200",
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
    iconKey: "website",
  };
}

export function BrandIcon({ name, className }: { name: string; className?: string }) {
  const style = getChannelStyle(name);
  const baseClass = className || "w-3.5 h-3.5";
  
  switch (style.iconKey) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={baseClass}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={baseClass}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={baseClass}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.03 1.61 4.19 1.12 1.24 2.69 1.95 4.31 2.15v3.74c-1.74-.03-3.44-.6-4.83-1.69-.16-.13-.3-.26-.45-.4v6.52c.04 4.07-2.3 8.01-6.43 9.1-3.95 1.16-8.38-1.01-9.74-4.89-1.54-4.14.7-9.02 4.93-10.32 1.3-.43 2.69-.45 4-.13v3.78c-1.39-.41-2.94-.1-4.08.77-1.44 1.05-2.02 3.01-1.31 4.7.72 1.83 2.76 2.94 4.7 2.6 1.94-.26 3.42-2 3.42-3.96V0h.02z" />
        </svg>
      );
    case "livinginsider":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={baseClass}>
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={baseClass}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}
