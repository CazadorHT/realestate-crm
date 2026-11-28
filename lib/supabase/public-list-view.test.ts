import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PUBLIC_PROPERTIES_LIST_VIEW,
  PUBLIC_PROPERTIES_FALLBACK_VIEW,
  queryPublicPropertiesView,
  fetchPropertyImagesBatched,
  isMissingRelationError,
  resetPublicListViewFallbackState,
} from "./public-list-view";

describe("public-list-view (3A CQRS Read View & Resilience Suite)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPublicListViewFallbackState();
  });

  describe("isMissingRelationError", () => {
    it("detects PostgreSQL 42P01 and PostgREST PGRST205 codes", () => {
      expect(isMissingRelationError({ code: "42P01", message: "relation does not exist" })).toBe(true);
      expect(isMissingRelationError({ code: "PGRST205", message: "schema cache miss" })).toBe(true);
    });

    it("detects missing view by message when code is absent", () => {
      expect(
        isMissingRelationError({
          message: 'relation "public.properties_public_list" does not exist',
        }),
      ).toBe(true);
      expect(
        isMissingRelationError({
          message: "Could not find the table 'public.properties_public_list' in the schema cache",
        }),
      ).toBe(true);
    });

    it("returns false for unrelated DB errors (e.g., 57014 timeout)", () => {
      expect(
        isMissingRelationError({
          code: "57014",
          message: "canceling statement due to statement timeout",
        }),
      ).toBe(false);
      expect(isMissingRelationError(null)).toBe(false);
    });
  });

  describe("queryPublicPropertiesView", () => {
    it("uses properties_public_list directly when deployed", async () => {
      const buildQuery = vi.fn(async (viewName: string) => ({
        data: [{ id: "p-1", viewName }],
        error: null,
      }));

      const res = await queryPublicPropertiesView(buildQuery);

      expect(buildQuery).toHaveBeenCalledTimes(1);
      expect(buildQuery).toHaveBeenCalledWith(PUBLIC_PROPERTIES_LIST_VIEW);
      expect(res.data).toEqual([{ id: "p-1", viewName: "properties_public_list" }]);
      expect(res.error).toBeNull();
    });

    it("automatically falls back to `properties` when view is not yet migrated (42P01 / PGRST205)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const buildQuery = vi.fn(async (viewName: string) => {
        if (viewName === PUBLIC_PROPERTIES_LIST_VIEW) {
          return {
            data: null,
            error: { code: "PGRST205", message: "Could not find the table 'public.properties_public_list'" },
          };
        }
        return { data: [{ id: "fallback-1" }], error: null };
      });

      const res1 = await queryPublicPropertiesView(buildQuery);
      expect(res1.data).toEqual([{ id: "fallback-1" }]);
      expect(res1.error).toBeNull();
      expect(buildQuery).toHaveBeenNthCalledWith(1, PUBLIC_PROPERTIES_LIST_VIEW);
      expect(buildQuery).toHaveBeenNthCalledWith(2, PUBLIC_PROPERTIES_FALLBACK_VIEW);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      // Subsequent call within 60s cooldown should skip the missing view directly (no wasted round-trip)
      buildQuery.mockClear();
      const res2 = await queryPublicPropertiesView(buildQuery);
      expect(res2.data).toEqual([{ id: "fallback-1" }]);
      expect(buildQuery).toHaveBeenCalledTimes(1);
      expect(buildQuery).toHaveBeenCalledWith(PUBLIC_PROPERTIES_FALLBACK_VIEW);

      warnSpy.mockRestore();
    });

    it("does NOT swallow non-missing-relation errors like 57014 timeout", async () => {
      const buildQuery = vi.fn(async () => ({
        data: null,
        error: { code: "57014", message: "canceling statement due to statement timeout" },
      }));

      const res = await queryPublicPropertiesView(buildQuery);
      expect(buildQuery).toHaveBeenCalledTimes(1);
      expect(res.error?.code).toBe("57014");
    });
  });

  describe("fetchPropertyImagesBatched", () => {
    it("returns empty map and makes 0 DB calls for empty/invalid IDs", async () => {
      const fromMock = vi.fn();
      const supabase = { from: fromMock } as any;

      const map = await fetchPropertyImagesBatched(supabase, [null, undefined, "", "   "]);
      expect(map.size).toBe(0);
      expect(fromMock).not.toHaveBeenCalled();
    });

    it("chunks IDs by batchSize=25, deduplicates IDs, and sorts by is_cover DESC then sort_order ASC", async () => {
      const inCalls: string[][] = [];
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            in: vi.fn((_col: string, ids: string[]) => {
              inCalls.push(ids);
              return Promise.resolve({
                data: ids.flatMap((id) => [
                  { property_id: id, image_url: `${id}-2.jpg`, storage_path: null, is_cover: false, sort_order: 2 },
                  { property_id: id, image_url: `${id}-cover.jpg`, storage_path: null, is_cover: true, sort_order: 5 },
                  { property_id: id, image_url: `${id}-1.jpg`, storage_path: null, is_cover: false, sort_order: 1 },
                ]),
                error: null,
              });
            }),
          })),
        })),
      } as any;

      // 60 unique IDs + 5 duplicates -> should make 3 chunks (25, 25, 10)
      const ids = Array.from({ length: 60 }, (_, i) => `prop-${i}`);
      const map = await fetchPropertyImagesBatched(supabase, [...ids, "prop-0", "prop-1", "prop-2"]);

      expect(inCalls.length).toBe(3);
      expect(inCalls.map((c) => c.length)).toEqual([25, 25, 10]);
      expect(map.size).toBe(60);

      const first = map.get("prop-0")!;
      expect(first.map((x) => x.image_url)).toEqual([
        "prop-0-cover.jpg",
        "prop-0-1.jpg",
        "prop-0-2.jpg",
      ]);
    });

    it("survives partial chunk failure without throwing (graceful degradation)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      let callIdx = 0;
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            in: vi.fn((_col: string, ids: string[]) => {
              callIdx++;
              if (callIdx === 1) {
                return Promise.resolve({ data: null, error: { message: "transient network error" } });
              }
              return Promise.resolve({
                data: ids.map((id) => ({
                  property_id: id,
                  image_url: `${id}.jpg`,
                  storage_path: null,
                  is_cover: true,
                  sort_order: 0,
                })),
                error: null,
              });
            }),
          })),
        })),
      } as any;

      const ids = Array.from({ length: 30 }, (_, i) => `p-${i}`);
      const map = await fetchPropertyImagesBatched(supabase, ids, { batchSize: 25 });

      // Chunk 1 failed gracefully, chunk 2 (5 items) succeeded
      expect(map.size).toBe(5);
      expect(map.get("p-25")?.[0].image_url).toBe("p-25.jpg");
      warnSpy.mockRestore();
    });
  });
});
