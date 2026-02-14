/**
 * Helper functions for property images
 */

// Get Supabase project URL from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET_NAME = "property-images";

/**
 * Generate public URL from storage path
 * @param storagePath - path in storage like "properties/xxx.jpg"
 * @returns public URL
 */
export function getPublicImageUrl(storagePath: string): string {
  if (!storagePath) return "";

  // 0. If it's already a full URL, return as is
  if (storagePath.trim().startsWith("http")) {
    return storagePath.trim();
  }

  // 1. Clean up SUPABASE_URL (ensure no trailing slash)
  const baseUrl = SUPABASE_URL?.replace(/\/+$/, "");

  // 2. Clean up storagePath (remove leading/trailing slashes and encode special chars)
  const cleanPath = storagePath?.trim().replace(/^\/+|\/+$/g, "") || "";

  if (!baseUrl || !cleanPath) return "";

  // Encode the path to handle spaces and special characters correctly
  const encodedPath = cleanPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}/${encodedPath}`;
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
