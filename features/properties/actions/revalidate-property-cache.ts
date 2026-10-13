import { revalidateTag, revalidatePath } from "next/cache";
import { purgeCloudflareCache } from "@/lib/cloudflare";

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
  // Projects Hub
  "/projects",
  "/en/projects",
  "/zh/projects",
  "/ru/projects",
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
  "/api/public/popular-areas",
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
  "dashboard-stats",
  "dashboard-charts",
  "dashboard-performance",
];

export interface PropertyCacheRevalidateOptions {
  slug?: string | null;
  oldSlug?: string | null;
}

/**
 * [S-Tier] Comprehensive Multilingual Cache Purge and Revalidation
 * Revalidates Next.js ISR, Data Cache tags, and Cloudflare CDN Edge Cache
 * for all supported languages (TH, EN, ZH, RU) simultaneously.
 */
export async function revalidatePropertyPublicCache(options?: PropertyCacheRevalidateOptions) {
  const paths = [...PROPERTY_PUBLIC_PATHS];

  if (options?.slug) {
    paths.push(
      `/properties/${options.slug}`,
      `/en/properties/${options.slug}`,
      `/zh/properties/${options.slug}`,
      `/ru/properties/${options.slug}`
    );
  }

  if (options?.oldSlug && options.oldSlug !== options?.slug) {
    paths.push(
      `/properties/${options.oldSlug}`,
      `/en/properties/${options.oldSlug}`,
      `/zh/properties/${options.oldSlug}`,
      `/ru/properties/${options.oldSlug}`
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

  // 3. Purge Cloudflare Edge CDN Cache
  try {
    await purgeCloudflareCache(paths);
  } catch (error) {
    console.error("[Cloudflare] Targeted edge cache purge failed:", error);
  }
}
