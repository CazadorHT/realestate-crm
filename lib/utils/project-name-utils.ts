/**
 * Utility to parse bilingual project names.
 * When admins enter "เดอะ โมนูเมนต์ ทองหล่อ (The Monument Thong Lo)" into the Thai name,
 * this function strips the English from the Thai name and extracts the English name.
 */
export function parseBilingualProjectName(
  rawName?: string | null,
  rawNameEn?: string | null
): { cleanTh: string; cleanEn: string | null } {
  if (!rawName) return { cleanTh: "", cleanEn: rawNameEn || null };

  let cleanTh = rawName.trim();
  let extractedEn = rawNameEn?.trim() || null;

  // 1. Detect parentheses containing mostly English, e.g. "เดอะ โมนูเมนต์ ทองหล่อ (The Monument Thong Lo)"
  const parenMatch = cleanTh.match(/\s*[\(\[\{]([A-Za-z0-9\s.,'’&/+-]+)[\)\]\}]\s*/);
  if (parenMatch) {
    if (!extractedEn) {
      extractedEn = parenMatch[1].trim();
    }
    // Remove the English in parentheses from the Thai name
    cleanTh = cleanTh.replace(parenMatch[0], " ").trim();
  }

  // 2. Detect divider slash or pipe with English following, e.g. "เดอะ โมนูเมนต์ ทองหล่อ / The Monument Thong Lo"
  const slashMatch = cleanTh.match(/\s*[/|]\s*([A-Za-z0-9\s.,'’&+-]+)$/);
  if (slashMatch) {
    if (!extractedEn) {
      extractedEn = slashMatch[1].trim();
    }
    cleanTh = cleanTh.slice(0, slashMatch.index).trim();
  }

  // 3. Detect trailing dash followed only by English, e.g. "เดอะ โมนูเมนต์ ทองหล่อ - The Monument Thong Lo"
  const dashMatch = cleanTh.match(/\s*[-–—]\s*([A-Za-z0-9\s.,'’&+-]+)$/);
  if (dashMatch) {
    const before = cleanTh.slice(0, dashMatch.index).trim();
    // Only strip if what precedes contains Thai characters and what follows is purely English
    if (/[\u0E00-\u0E7F]/.test(before) && /^[A-Za-z0-9\s.,'’&+-]+$/.test(dashMatch[1].trim())) {
      if (!extractedEn) {
        extractedEn = dashMatch[1].trim();
      }
      cleanTh = before;
    }
  }

  // 4. If the name contains purely English characters and no Thai, populate extractedEn as well
  const hasThai = /[\u0E00-\u0E7F]/.test(cleanTh);
  if (!hasThai && !extractedEn && cleanTh.length > 0) {
    extractedEn = cleanTh;
  }

  // Normalize duplicate spaces
  cleanTh = cleanTh.replace(/\s+/g, " ").trim();

  return { cleanTh, cleanEn: extractedEn };
}
