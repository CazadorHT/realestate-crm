import dynamic from "next/dynamic";
import { RecentlyViewedSkeleton } from "@/components/public/RecentlyViewedSkeleton";
import { MortgageCalculatorSkeleton } from "@/components/public/MortgageCalculatorSkeleton";

/**
 * [S-Tier Performance]
 * These components are either:
 * 1. Interaction-heavy (Mortgage Calculator)
 * 2. Browser-storage dependent (Recently Viewed)
 * 3. Non-critical for initial SEO (CTA)
 * 
 * Moving them to a Client Component allows us to use { ssr: false }
 * which drastically reduces the initial SSR HTML size and hydration work.
 */

export const RecentlyViewedSection = dynamic(
  () => import("@/components/public/RecentlyViewedSection").then((mod) => mod.RecentlyViewedSection),
  { 
    ssr: false,
    loading: () => <RecentlyViewedSkeleton /> 
  }
);

export const MortgageCalculatorSection = dynamic(
  () => import("@/components/public/MortgageCalculatorSection").then((mod) => mod.MortgageCalculatorSection),
  { 
    ssr: false,
    loading: () => <MortgageCalculatorSkeleton /> 
  }
);

export const CTASection = dynamic(
  () => import("@/components/public/CTASection").then((mod) => mod.CTASection),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse" /> 
  }
);
