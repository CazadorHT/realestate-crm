import type { MapPinsPayload } from "./map-pins";

let memoryPinsCache: { data: MapPinsPayload; timestamp: number } | null = null;
const MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour in-process hot cache on top of 1-year Next.js Data Cache

export function getMapPinsMemoryCache(): MapPinsPayload | null {
  if (!memoryPinsCache) return null;
  if (Date.now() - memoryPinsCache.timestamp >= MEMORY_TTL_MS) {
    memoryPinsCache = null;
    return null;
  }
  return memoryPinsCache.data;
}

export function setMapPinsMemoryCache(data: MapPinsPayload): void {
  memoryPinsCache = { data, timestamp: Date.now() };
}

export function invalidateMapPinsMemoryCache(): void {
  memoryPinsCache = null;
}
