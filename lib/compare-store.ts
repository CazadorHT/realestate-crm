const KEY = "compare_ids_v1";
const MAX = 3;

export function readCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function toggleCompareId(id: string): string[] {
  if (typeof window === "undefined") return [];
  const cur = readCompareIds();
  const next = cur.includes(id)
    ? cur.filter((x) => x !== id)
    : [...cur, id].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("compare-updated"));
  return next;
}

export function removeCompareId(id: string) {
  if (typeof window === "undefined") return;
  const cur = readCompareIds();
  const next = cur.filter((x) => x !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("compare-updated"));
}

export function clearCompare() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("compare-updated"));
}
