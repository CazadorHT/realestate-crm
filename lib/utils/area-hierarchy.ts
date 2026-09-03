/**
 * Area Hierarchy & Parent-Child Zone Clustering System
 * Provides parent-child relationships, count aggregation, and filter token expansion.
 */

export interface RawAreaItem {
  name: string;
  count: number;
  name_en?: string | null;
  name_cn?: string | null;
  name_ru?: string | null;
  parent_name?: string | null;
}

export interface AreaHierarchyItem extends RawAreaItem {
  localizedName: string;
  totalCount: number; // parent count + sum of children count
  children: AreaHierarchyItem[];
}

/**
 * Standard Bangkok & Metropolitan Area Parent-Child Definitions
 * Maps sub-area names (Thai / English) to their canonical Parent Zone name (Thai).
 */
export const AREA_PARENT_MAP: Record<string, string> = {
  // กรุงเทพกรีฑา zone
  "กรุงเทพกรีฑาตัดใหม่": "กรุงเทพกรีฑา",
  "Krungthep Kreetha New Road": "กรุงเทพกรีฑา",

  // พระราม 4 zone
  "พระราม 4 - คลองเตย": "พระราม 4",
  "พระราม 4 - กล้วยน้ำไท": "พระราม 4",
  "Rama 4 - Khlong Toei": "พระราม 4",
  "Rama IV - Khlong Toei": "พระราม 4",

  // ชิดลม - เพลินจิต zone
  "ชิดลม": "ชิดลม - เพลินจิต",
  "เพลินจิต": "ชิดลม - เพลินจิต",
  "Chidlom": "ชิดลม - เพลินจิต",
  "Ploenchit": "ชิดลม - เพลินจิต",

  // บางนา zone
  "บางนา - ตราด": "บางนา",
  "บางนาตราด": "บางนา",
  "Bang Na - Trat": "บางนา",
  "ลาซาล - แบริ่ง": "บางนา",
  "Lasalle - Bearing": "บางนา",

  // รัชดา - พระราม 9 zone
  "รัชดา": "รัชดาภิเษก",
  "รัชดาภิเษก": "รัชดาภิเษก",
  "Ratchada": "รัชดาภิเษก",
};

/**
 * Detect parent name for a given area name
 */
export function getParentAreaName(areaName: string): string | null {
  if (!areaName) return null;
  const trimmed = areaName.trim();
  if (AREA_PARENT_MAP[trimmed]) {
    return AREA_PARENT_MAP[trimmed];
  }

  // Prefix matching heuristics for common sub-zones (e.g. "พระราม 4 - xxx" -> "พระราม 4")
  if (trimmed.includes(" - ")) {
    const [prefix] = trimmed.split(" - ");
    if (prefix && prefix.trim() !== trimmed) {
      return prefix.trim();
    }
  }

  return null;
}

/**
 * Build Area Hierarchy Tree with count aggregation
 */
export function buildAreaHierarchy(
  areas: RawAreaItem[],
  language: string = "th",
  getLocaleValueFn?: (obj: any, field: string, lang: string) => string
): AreaHierarchyItem[] {
  const cleanAreas = (areas || []).filter(
    (a) => Boolean(a && a.name && a.name.trim() !== "")
  );

  const getLocalized = (a: RawAreaItem) => {
    if (getLocaleValueFn) {
      return (
        getLocaleValueFn(
          {
            name: a.name,
            name_en: a.name_en,
            name_cn: a.name_cn,
            name_ru: a.name_ru,
          },
          "name",
          language
        ) || a.name || ""
      );
    }
    return (
      (language === "en"
        ? a.name_en || a.name
        : language === "cn"
        ? a.name_cn || a.name
        : language === "ru"
        ? a.name_ru || a.name
        : a.name) || ""
    );
  };

  // Map of all items
  const itemMap = new Map<string, AreaHierarchyItem>();

  cleanAreas.forEach((a) => {
    itemMap.set(a.name.trim(), {
      ...a,
      name: a.name.trim(),
      localizedName: getLocalized(a),
      totalCount: a.count || 0,
      children: [],
    });
  });

  const topLevel: AreaHierarchyItem[] = [];
  const childNames = new Set<string>();

  // Assign children to parents
  cleanAreas.forEach((a) => {
    const areaName = a.name.trim();
    const currentItem = itemMap.get(areaName);
    if (!currentItem) return;

    const parentName = a.parent_name || getParentAreaName(areaName);

    if (parentName && parentName !== areaName) {
      let parentItem = itemMap.get(parentName);
      if (!parentItem) {
        // Create virtual parent item if parent has no direct properties
        parentItem = {
          name: parentName,
          count: 0,
          name_en: a.name_en,
          name_cn: a.name_cn,
          name_ru: a.name_ru,
          localizedName: getLocalized({ name: parentName, count: 0, name_en: a.name_en }),
          totalCount: 0,
          children: [],
        };
        itemMap.set(parentName, parentItem);
      }

      parentItem.children.push(currentItem);
      parentItem.totalCount += currentItem.count;
      childNames.add(areaName);
    }
  });

  // Collect top-level items
  itemMap.forEach((item, name) => {
    if (!childNames.has(name)) {
      topLevel.push(item);
    }
  });

  // Sort top-level items and their children alphabetically by locale
  const localeSort = (a: AreaHierarchyItem, b: AreaHierarchyItem) =>
    a.localizedName.localeCompare(b.localizedName, language === "th" ? "th" : language);

  topLevel.forEach((p) => {
    if (p.children.length > 0) {
      p.children.sort(localeSort);
    }
  });

  return topLevel.sort(localeSort);
}

/**
 * Expand area filter tokens into all matching descendant names
 * e.g., "กรุงเทพกรีฑา" -> ["กรุงเทพกรีฑา", "กรุงเทพกรีฑาตัดใหม่"]
 */
export function expandAreaTokens(
  selectedAreaTokens: string[],
  hierarchyTree: AreaHierarchyItem[]
): string[] {
  if (!selectedAreaTokens || selectedAreaTokens.length === 0) return [];
  const resultSet = new Set<string>();

  const tokenList = selectedAreaTokens.map((t) => t.trim()).filter(Boolean);

  const findAndAddDescendants = (node: AreaHierarchyItem, targetName: string): boolean => {
    if (node.name === targetName) {
      resultSet.add(node.name);
      node.children.forEach((c) => resultSet.add(c.name));
      return true;
    }
    for (const child of node.children) {
      if (child.name === targetName) {
        resultSet.add(child.name);
        return true;
      }
    }
    return false;
  };

  tokenList.forEach((token) => {
    if (token === "ALL") return;
    let found = false;
    for (const root of hierarchyTree) {
      if (findAndAddDescendants(root, token)) {
        found = true;
        break;
      }
    }
    if (!found) {
      resultSet.add(token);
    }
  });

  return Array.from(resultSet);
}
