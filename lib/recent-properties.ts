export type RecentProperty = {
  id: string;
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  image_url?: string | null;
  price_text?: string | null;
  price?: number | null;
  original_price?: number | null;
  rental_price?: number | null;
  original_rental_price?: number | null;
  province?: string | null;
  popular_area?: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  price_per_sqm?: number | null;
  rent_price_per_sqm?: number | null;
  size_sqm?: number | null;
  property_type?: string | null;
  listing_type?: string | null;
  slug?: string | null;
  features?: {
    id: string;
    name: string;
    name_en?: string | null;
    name_cn?: string | null;
    icon_key: string;
  }[];
  ts: number;
};

const KEY = "recent_properties_v1";
const MAX = 10;

export function addRecentProperty(item: Omit<RecentProperty, "ts">) {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const existing = readRecentProperties();

  const next: RecentProperty[] = [
    { ...item, ts: now },
    ...existing.filter((x) => x.id !== item.id),
  ].slice(0, MAX);

  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("recent-updated"));
}

export function readRecentProperties(): RecentProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentProperty[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearRecentProperties() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("recent-updated"));
}
