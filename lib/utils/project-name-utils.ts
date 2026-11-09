/**
 * Utility to parse bilingual project names safely.
 * Accepts string, object ({ th, en }), null, or undefined.
 * Strips English from Thai name when mixed, and extracts the English name.
 */
export function parseBilingualProjectName(
  rawName?: string | { th?: string; en?: string } | null | unknown,
  rawNameEn?: string | null | unknown
): { cleanTh: string; cleanEn: string | null; hasEnglishLine: boolean } {
  let thInput = "";
  let enInput: string | null = null;

  // 1. Resolve rawName if it is an object { th, en }
  if (rawName && typeof rawName === "object") {
    const obj = rawName as Record<string, unknown>;
    if (typeof obj.th === "string") thInput = obj.th;
    if (typeof obj.en === "string") enInput = obj.en;
  } else if (typeof rawName === "string") {
    thInput = rawName;
  } else if (rawName != null) {
    thInput = String(rawName);
  }

  // 2. Resolve rawNameEn if explicitly passed as string
  if (typeof rawNameEn === "string" && rawNameEn.trim()) {
    enInput = rawNameEn.trim();
  }

  if (!thInput && !enInput) {
    return { cleanTh: "", cleanEn: null, hasEnglishLine: false };
  }

  let cleanTh = thInput.trim();
  let extractedEn = enInput ? enInput.trim() : null;

  // 3. Detect parentheses containing mostly English, e.g. "เดอะ โมนูเมนต์ ทองหล่อ (The Monument Thong Lo)"
  const parenMatch = cleanTh.match(/\s*[\(\[\{]([A-Za-z0-9\s.,'’&/+-]+)[\)\]\}]\s*/);
  if (parenMatch) {
    if (!extractedEn) {
      extractedEn = parenMatch[1].trim();
    }
    // Remove the English in parentheses from the Thai name
    cleanTh = cleanTh.replace(parenMatch[0], " ").trim();
  }

  // 4. Detect divider slash or pipe with English following, e.g. "เดอะ โมนูเมนต์ ทองหล่อ / The Monument Thong Lo"
  const slashMatch = cleanTh.match(/\s*[/|]\s*([A-Za-z0-9\s.,'’&+-]+)$/);
  if (slashMatch) {
    if (!extractedEn) {
      extractedEn = slashMatch[1].trim();
    }
    cleanTh = cleanTh.slice(0, slashMatch.index).trim();
  }

  // 5. Detect trailing dash followed only by English, e.g. "เดอะ โมนูเมนต์ ทองหล่อ - The Monument Thong Lo"
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

  // 6. If the name contains purely English characters and no Thai, populate extractedEn as well
  const hasThai = /[\u0E00-\u0E7F]/.test(cleanTh);
  if (!hasThai && !extractedEn && cleanTh.length > 0) {
    extractedEn = cleanTh;
  }

  // Normalize duplicate spaces
  cleanTh = cleanTh.replace(/\s+/g, " ").trim();
  const hasEnglishLine = Boolean(extractedEn && extractedEn.toLowerCase() !== cleanTh.toLowerCase());

  return { cleanTh, cleanEn: extractedEn, hasEnglishLine };
}
