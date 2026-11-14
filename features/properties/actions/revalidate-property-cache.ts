import { revalidateTag, revalidatePath } from "next/cache";
import { purgeCloudflareCache } from "@/lib/cloudflare";
import { invalidateMapPinsMemoryCache } from "@/lib/services/map-pins-memory";
import { invalidateDashboardStatsCache } from "@/features/properties/queries/stats";
import { invalidateFilterMetadataCache } from "./filter-metadata";
import { invalidateDashboardMetricsCache } from "@/features/dashboard/queries/stats";
import { invalidateExecutiveAISummaryCache } from "@/features/dashboard/queries/executive-ai-summary-action";

/**
 * 🌐 Complete list of static public property listing pages across all 4 supported locales:
 * - Thai (root default): /
 * - English: /en
 * - Chinese: /zh
 * - Russian: /ru
 */
export const PROPERTY_PUBLIC_PATHS = [
  // Homepages
  "/",
  "/en",
  "/zh",
  "/ru",
  // Properties Main Hub
  "/properties",
  "/en/properties",
  "/zh/properties",
  "/ru/properties",
  // Interactive Map Explorer Hub
  "/map",
  "/en/map",
  "/zh/map",
  "/ru/map",
  // Projects Hub
  "/projects",
  "/en/projects",
  "/zh/projects",
  "/ru/projects",
  // Transit & Station Hub
  "/near-station",
  "/en/near-station",
  "/zh/near-station",
  "/ru/near-station",
  // Search Hub
  "/search",
  "/en/search",
  "/zh/search",
  "/ru/search",
  // Category Landing Pages
  "/properties/prime-cbd",
  "/en/properties/prime-cbd",
  "/zh/properties/prime-cbd",
  "/ru/properties/prime-cbd",
  "/properties/pet-friendly-condo",
  "/en/properties/pet-friendly-condo",
  "/zh/properties/pet-friendly-condo",
  "/ru/properties/pet-friendly-condo",
  "/properties/luxury-villa",
  "/en/properties/luxury-villa",
  "/zh/properties/luxury-villa",
  "/ru/properties/luxury-villa",
  "/properties/office-for-rent",
  "/en/properties/office-for-rent",
  "/zh/properties/office-for-rent",
  "/ru/properties/office-for-rent",
  // Public APIs and Syndication Feeds
  "/sitemap.xml",
  "/api/public/properties",
  "/api/public/map-pins",
  "/api/public/popular-areas",
  "/api/public/search-suggestions",
  "/api/public/floating-agents",
  "/api/syndication/feed/meta",
  "/api/syndication/feed/facebook",
];

export const PROPERTY_CACHE_TAGS = [
  "properties",
  "public-data",
  "public-properties",
  "property-facets",
  "meta-catalog-feed",
  "popular-areas",
  "projects",
  "project-slugs",
  "dashboard-stats",
  "dashboard-charts",
  "dashboard-performance",
];

export interface PropertyCacheRevalidateOptions {
  slug?: string | null;
  oldSlug?: string | null;
  projectSlug?: string | null;
  oldProjectSlug?: string | null;
}

function cleanPathSegment(segment?: string | null): string | null {
  if (!segment) return null;
  const trimmed = segment.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  try {
    return encodeURI(decodeURI(trimmed));
  } catch {
    return trimmed;
  }
}

/**
 * [S-Tier] Comprehensive Multilingual Cache Purge and Revalidation
 * Revalidates Next.js ISR, Data Cache tags, and Cloudflare CDN Edge Cache
 * for all supported languages (TH, EN, ZH, RU) simultaneously.
 */
export async function revalidatePropertyPublicCache(options?: PropertyCacheRevalidateOptions) {
  invalidateMapPinsMemoryCache();
  invalidateDashboardStatsCache();
  invalidateFilterMetadataCache();
  invalidateDashboardMetricsCache();
  invalidateExecutiveAISummaryCache();
  const paths = [...PROPERTY_PUBLIC_PATHS];

  const slug = cleanPathSegment(options?.slug);
  const oldSlug = cleanPathSegment(options?.oldSlug);
  const projectSlug = cleanPathSegment(options?.projectSlug);
  const oldProjectSlug = cleanPathSegment(options?.oldProjectSlug);

  if (slug) {
    paths.push(
      `/properties/${slug}`,
      `/en/properties/${slug}`,
      `/zh/properties/${slug}`,
      `/ru/properties/${slug}`
    );
  }

  if (oldSlug && oldSlug !== slug) {
    paths.push(
      `/properties/${oldSlug}`,
      `/en/properties/${oldSlug}`,
      `/zh/properties/${oldSlug}`,
      `/ru/properties/${oldSlug}`
    );
  }

  if (projectSlug) {
    paths.push(
      `/projects/${projectSlug}`,
      `/en/projects/${projectSlug}`,
      `/zh/projects/${projectSlug}`,
      `/ru/projects/${projectSlug}`
    );
  }

  if (oldProjectSlug && oldProjectSlug !== projectSlug) {
    paths.push(
      `/projects/${oldProjectSlug}`,
      `/en/projects/${oldProjectSlug}`,
      `/zh/projects/${oldProjectSlug}`,
      `/ru/projects/${oldProjectSlug}`
    );
  }

  // 1. Next.js On-Demand ISR Route Revalidation
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // Silent catch if outside Next.js request context (e.g., test or background worker)
    }
  }

  // 2. Next.js Unstable Data Cache Tags
  for (const tag of PROPERTY_CACHE_TAGS) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // Silent catch
    }
  }

  if (projectSlug) {
    try {
      revalidateTag(`project-${projectSlug}`, "max");
    } catch {
      // Silent catch
    }
  }

  if (oldProjectSlug && oldProjectSlug !== projectSlug) {
    try {
      revalidateTag(`project-${oldProjectSlug}`, "max");
    } catch {
      // Silent catch
    }
  }

  // 3. Purge Cloudflare Edge CDN Cache
  try {
    await purgeCloudflareCache(paths);
  } catch (error) {
    console.error("[Cloudflare] Targeted edge cache purge failed:", error);
  }
}
