/**
 * Favorite Store
 * Client-side storage for favorite properties using localStorage
 */

const STORAGE_KEY = "favorite-properties";

/**
 * Read favorite property IDs from localStorage
 */
export function readFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Write favorite property IDs to localStorage
 */
function writeFavoriteIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    // Dispatch custom event for other components to react
    window.dispatchEvent(new Event("favorite-updated"));
  } catch (error) {
    console.error("Failed to save favorites:", error);
  }
}

/**
 * Toggle a property ID in favorites
 */
export function toggleFavoriteId(id: string) {
  const current = readFavoriteIds();
  const index = current.indexOf(id);

  if (index >= 0) {
    // Remove from favorites
    current.splice(index, 1);
  } else {
    // Add to favorites
    current.push(id);
  }

  writeFavoriteIds(current);
}

/**
 * Clear all favorites
 */
export function clearFavorites() {
  writeFavoriteIds([]);
}

/**
 * Check if a property is favorited
 */
export function isFavorite(id: string): boolean {
  return readFavoriteIds().includes(id);
}
