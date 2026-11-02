"use client";

import { useMemo } from "react";
import Supercluster, { type PointFeature } from "supercluster";
import type { SlimMapPin } from "@/lib/services/map-pins";
import { resolvePinPrice } from "./map-price-utils";

export interface MapLocationGroup {
  groupId: string;
  latitude: number;
  longitude: number;
  projectId: string | null;
  units: SlimMapPin[];
  unitIds: Set<string>;
  leadPriceLabel: string;
  leadNumericPrice: number;
  hasAnyDiscount: boolean;
  hasHotDeal: boolean;
}

export type MapBoundsTuple = [number, number, number, number]; // [west, south, east, north]

export type ClusterOrGroupItem =
  | {
      type: "cluster";
      clusterId: number;
      latitude: number;
      longitude: number;
      pointCount: number;
      unitCount: number;
      expansionZoom: number;
    }
  | {
      type: "group";
      group: MapLocationGroup;
    };

/**
 * Groups properties that share EITHER:
 * 1) The same `project_id` (all condo units in the same building), OR
 * 2) Exact/overlapping coordinates within ~5 meters (`lat.toFixed(4), lng.toFixed(4)`)
 *    -> Prevents standalone houses/land pinned at the same soi entrance from burying each other!
 */
export function useMapClusters(params: {
  filteredPins: SlimMapPin[];
  activeListingFilter: string;
  language: string;
  bounds: MapBoundsTuple | null;
  zoom: number;
}) {
  const { filteredPins, activeListingFilter, language, bounds, zoom } = params;

  // Step 1: Group overlapping units into slideable location groups
  const groups = useMemo<MapLocationGroup[]>(() => {
    const byKey = new Map<string, SlimMapPin[]>();

    for (const pin of filteredPins) {
      if (!Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude)) {
        continue;
      }
      // 4 decimal places is ~11m grid; if project_id exists, group by project_id first
      const key = pin.project_id
        ? `proj:${pin.project_id}`
        : `coord:${pin.latitude.toFixed(4)},${pin.longitude.toFixed(4)}`;

      const existing = byKey.get(key);
      if (existing) {
        existing.push(pin);
      } else {
        byKey.set(key, [pin]);
      }
    }

    const result: MapLocationGroup[] = [];

    for (const [key, rawUnits] of byKey.entries()) {
      // Sort units inside a group by lowest positive price first (so "฿3.2M+" is accurate!)
      const priced = rawUnits.map((u) => ({
        unit: u,
        resolved: resolvePinPrice(u, activeListingFilter, language),
      }));

      priced.sort((a, b) => {
        const pa = a.resolved.numericValue > 0 ? a.resolved.numericValue : Number.MAX_SAFE_INTEGER;
        const pb = b.resolved.numericValue > 0 ? b.resolved.numericValue : Number.MAX_SAFE_INTEGER;
        return pa - pb;
      });

      const sortedUnits = priced.map((p) => p.unit);
      const leadResolved = priced[0].resolved;
      const isMulti = sortedUnits.length > 1;
      const plusSign = isMulti && leadResolved.numericValue > 0 ? "+" : "";

      const hasAnyDiscount = priced.some((p) => p.resolved.hasDiscount);
      const hasHotDeal = sortedUnits.some((u) => !!u.is_hot_deal);

      // Compute centroid coordinate of the group
      const avgLat =
        sortedUnits.reduce((sum, u) => sum + u.latitude, 0) / sortedUnits.length;
      const avgLng =
        sortedUnits.reduce((sum, u) => sum + u.longitude, 0) / sortedUnits.length;

      result.push({
        groupId: key,
        latitude: avgLat,
        longitude: avgLng,
        projectId: sortedUnits[0].project_id || null,
        units: sortedUnits,
        unitIds: new Set(sortedUnits.map((u) => u.id)),
        leadPriceLabel: `${leadResolved.displayLabel}${plusSign}`,
        leadNumericPrice: leadResolved.numericValue,
        hasAnyDiscount,
        hasHotDeal,
      });
    }

    return result;
  }, [filteredPins, activeListingFilter, language]);

  // Step 2: Build Supercluster index in browser memory (tuned so price pills appear richly at city/area zoom)
  const { supercluster, groupLookup } = useMemo(() => {
    const lookup = new Map<string, MapLocationGroup>();
    const sc = new Supercluster<{ groupId: string; unitCount: number }>({
      radius: 42,
      maxZoom: 12, // At zoom >= 13 (district/neighborhood level), every building shows its real Price Pill!
      minPoints: 3,
      map: (props) => ({ unitCount: props.unitCount }),
      reduce: (accumulated, props) => {
        accumulated.unitCount += props.unitCount;
      },
    });

    const features: PointFeature<{ groupId: string; unitCount: number }>[] =
      groups.map((g) => {
        lookup.set(g.groupId, g);
        return {
          type: "Feature",
          properties: {
            groupId: g.groupId,
            unitCount: g.units.length,
          },
          geometry: {
            type: "Point",
            coordinates: [g.longitude, g.latitude],
          },
        };
      });

    sc.load(features);
    return { supercluster: sc, groupLookup: lookup };
  }, [groups]);

  // Step 3: Viewport Culling — only emit markers currently inside the visible screen bounds
  const visibleItems = useMemo<ClusterOrGroupItem[]>(() => {
    const activeBounds: MapBoundsTuple = bounds || [97.3, 5.5, 105.7, 20.6];
    const z = Math.max(0, Math.min(20, Math.floor(zoom)));

    let rawClusters: any[] = [];
    try {
      rawClusters = supercluster.getClusters(activeBounds, z);
    } catch {
      rawClusters = [];
    }

    const items: ClusterOrGroupItem[] = [];
    for (const feat of rawClusters) {
      const [lng, lat] = feat.geometry.coordinates;
      if (feat.properties?.cluster) {
        const clusterId = feat.properties.cluster_id as number;
        let expansionZoom = z + 2;
        try {
          expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 16);
        } catch {
          expansionZoom = z + 2;
        }
        items.push({
          type: "cluster",
          clusterId,
          latitude: lat,
          longitude: lng,
          pointCount: feat.properties.point_count as number,
          unitCount: (feat.properties.unitCount as number) || feat.properties.point_count,
          expansionZoom,
        });
      } else {
        const group = groupLookup.get(feat.properties?.groupId);
        if (group) {
          items.push({
            type: "group",
            group,
          });
        }
      }
    }

    return items;
  }, [supercluster, groupLookup, bounds, zoom]);

  // Step 4: Properties inside current viewport bounds (used for "Search as map moves" 2-way sync!)
  const pinsInBounds = useMemo<SlimMapPin[]>(() => {
    if (!bounds) return filteredPins;
    const [west, south, east, north] = bounds;
    return filteredPins.filter(
      (p) =>
        p.longitude >= west &&
        p.longitude <= east &&
        p.latitude >= south &&
        p.latitude <= north
    );
  }, [filteredPins, bounds]);

  return {
    groups,
    visibleItems,
    pinsInBounds,
  };
}
