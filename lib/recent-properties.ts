export type RecentProperty = {
  id: string;
  title: string;
  image_url?: string | null;
  price_text?: string | null;
  province?: string | null;
  popular_area?: string | null;
  ts: number;
};

const KEY = "recent_properties_v1";
const MAX = 8;

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
