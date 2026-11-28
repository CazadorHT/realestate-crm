import type { SupabaseClient } from "@supabase/supabase-js";

export const PUBLIC_PROPERTIES_LIST_VIEW = "properties_public_list" as const;
export const PUBLIC_PROPERTIES_FALLBACK_VIEW = "properties" as const;

export type PublicPropertiesViewName =
  | typeof PUBLIC_PROPERTIES_LIST_VIEW
  | typeof PUBLIC_PROPERTIES_FALLBACK_VIEW;

export interface PropertyImageRow {
  property_id: string;
  image_url: string;
  storage_path: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
}

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: { code?: string; message?: string; details?: string | null; hint?: string | null } | null;
  count?: number | null;
}

const MISSING_VIEW_COOLDOWN_MS = 60_000;
let missingViewDetectedAt = 0;

export function resetPublicListViewFallbackState(): void {
  missingViewDetectedAt = 0;
}

export function isMissingRelationError(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("properties_public_list") &&
    (msg.includes("does not exist") || msg.includes("could not find the table"))
  );
}

/**
 * Type-safe, zero-downtime query runner for `public.properties_public_list`.
 *
 * - Uses the lightweight subquery-free view `properties_public_list` by default.
 * - If the SQL migration has not yet been applied in the target environment
 *   (`42P01` / `PGRST205`), logs a single warning and seamlessly falls back to
 *   `public.properties` for 60s before re-probing — preventing user-facing 500s.
 */
export async function queryPublicPropertiesView<T>(
  buildQuery: (viewName: PublicPropertiesViewName) => PromiseLike<SupabaseQueryResult<T>>,
): Promise<SupabaseQueryResult<T>> {
  const now = Date.now();
  const skipLightweightView =
    missingViewDetectedAt > 0 && now - missingViewDetectedAt < MISSING_VIEW_COOLDOWN_MS;

  if (!skipLightweightView) {
    const primaryRes = await buildQuery(PUBLIC_PROPERTIES_LIST_VIEW);
    if (!isMissingRelationError(primaryRes.error)) {
      return primaryRes;
    }

    missingViewDetectedAt = now;
    console.warn(
      "[DB COMPAT] View `properties_public_list` is not yet deployed; falling back to `properties` view for 60s.",
    );
  }

  return await buildQuery(PUBLIC_PROPERTIES_FALLBACK_VIEW);
}

export interface FetchPropertyImagesOptions {
  /** Max property IDs per batch (default 25 — safely stays under PostgREST's 1,000-row cap). */
  batchSize?: number;
  /** When true, fetches only rows marked `is_cover = true` (ideal for map pins / thumbnails). */
  coverOnly?: boolean;
}

/**
 * Type-safe, PostgREST-cap-proof batched image loader for `property_images`.
 *
 * - Deduplicates & validates `propertyIds` (guards against empty/null inputs).
 * - Splits into chunks of `batchSize` (default 25) and runs in parallel via `Promise.allSettled`
 *   so PostgREST's 1,000-row cap never truncates images and one transient error never breaks the page.
 * - Returns images pre-sorted by `is_cover DESC, sort_order ASC`.
 */
export async function fetchPropertyImagesBatched(
  supabase: SupabaseClient<any, any, any>,
  propertyIds: readonly (string | null | undefined)[],
  options: FetchPropertyImagesOptions = {},
): Promise<Map<string, PropertyImageRow[]>> {
  const result = new Map<string, PropertyImageRow[]>();
  const uniqueIds = Array.from(
    new Set(propertyIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)),
  );

  if (uniqueIds.length === 0) return result;

  const batchSize = Math.max(1, Math.min(options.batchSize ?? 25, 100));
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    chunks.push(uniqueIds.slice(i, i + batchSize));
  }

  const settled = await Promise.allSettled(
    chunks.map(async (chunk) => {
      let query = supabase
        .from("property_images")
        .select("property_id, image_url, storage_path, is_cover, sort_order")
        .in("property_id", chunk);

      if (options.coverOnly) {
        query = query.eq("is_cover", true);
      }

      const { data, error } = await query;
      if (error) {
        console.warn("[fetchPropertyImagesBatched] Chunk error:", error.message);
        return [] as PropertyImageRow[];
      }
      return (data || []) as PropertyImageRow[];
    }),
  );

  for (const outcome of settled) {
    if (outcome.status !== "fulfilled") continue;
    for (const img of outcome.value) {
      if (!img.property_id) continue;
      const list = result.get(img.property_id) || [];
      list.push(img);
      result.set(img.property_id, list);
    }
  }

  for (const [propId, imgs] of result.entries()) {
    imgs.sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1;
      if (!a.is_cover && b.is_cover) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    });
    result.set(propId, imgs);
  }

  return result;
}
