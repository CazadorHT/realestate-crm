/**
 * Helper functions for property images
 */

// Get Supabase project URL from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET_NAME = "property-images";

/**
 * Generate public URL from storage path with optional optimization
 * @param storagePath - path in storage like "properties/xxx.jpg"
 * @param bucket - specific storage bucket (default: "property-images")
 * @param options - transformation options (width, quality, format)
 * @returns public URL (optimized if options provided)
 */
export function getPublicImageUrl(
  storagePath?: string | null,
  bucket: string = BUCKET_NAME,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "origin";
  },
): string {
  if (!storagePath || typeof storagePath !== "string" || !storagePath.trim()) return "";

  // Use dedicated CDN domain on Production, but fallback to Supabase URL in local development to avoid CORS/Proxy issues
  const isDev = process.env.NODE_ENV === "development";
  const explicitCdn = process.env.NEXT_PUBLIC_CDN_URL?.trim();
  const cdnUrl = explicitCdn || (isDev ? "" : "https://cdn.vccasset.com");
  let targetCdn = cdnUrl ? cdnUrl.replace(/\/+$/, "") : "";
  if (targetCdn && !targetCdn.startsWith("http")) targetCdn = `https://${targetCdn}`;

  // 0. If it's already a full URL
  if (storagePath.trim().startsWith("http")) {
    const trimmed = storagePath.trim();
    if (targetCdn && trimmed.includes(".supabase.co/storage/v1/object/public/")) {
      return trimmed.replace(/https:\/\/[^/]+\.supabase\.co/, targetCdn);
    }
    if (!explicitCdn && (trimmed.includes("vccasset.com/storage/v1/object/public/") || trimmed.includes("cdn.vccasset.com"))) {
      const supabaseBase = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qaihjhvdwfafawezxivb.supabase.co").replace(/\/+$/, "");
      return trimmed.replace(/https:\/\/[^/]+\.(vccasset\.com|supabase\.co)/, supabaseBase);
    }
    return trimmed;
  }

  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qaihjhvdwfafawezxivb.supabase.co";
  let baseUrl = rawSupabaseUrl.replace(/\/+$/, "");
  if (baseUrl && !baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  // 2. Clean up storagePath (remove leading/trailing slashes, strip duplicate bucket name, and encode special chars)
  let cleanPath = storagePath?.trim().replace(/^\/+|\/+$/g, "") || "";
  if (cleanPath.startsWith(`${bucket}/`)) {
    cleanPath = cleanPath.replace(new RegExp(`^${bucket}/`), "");
  }

  if (!cleanPath) return "";

  // Encode the path to handle spaces and special characters correctly
  const encodedPath = cleanPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  let originUrl = targetCdn || baseUrl;
  if (originUrl && !originUrl.startsWith("http")) {
    originUrl = `https://${originUrl}`;
  }

  // Return public object URL routed via Cloudflare Worker CDN domain
  return `${originUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * Generate public URL specifically for an avatar
 * @param storagePath - path in 'avatars' bucket
 * @returns public URL
 */
export function getPublicAvatarUrl(storagePath: string): string | null {
  if (!storagePath) return null;
  // If already absolute URL, return as is
  if (storagePath.trim().startsWith("http")) return storagePath.trim();
  return getPublicImageUrl(storagePath, "avatars");
}

/**
 * Extract cover image from property images array
 * @param images - array of property images
 * @returns cover image URL or null
 */
export function getCoverImageUrl(
  images: { image_url: string; is_cover: boolean; sort_order: number }[],
): string | null {
  if (!images || images.length === 0) return null;

  // Try to find is_cover = true
  const coverImage = images.find((img) => img.is_cover);
  if (coverImage) return coverImage.image_url;

  // Fallback to first image (lowest sort_order)
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return sortedImages[0]?.image_url || null;
}
