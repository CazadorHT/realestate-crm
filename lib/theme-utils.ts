/**
 * Helper to convert Hex color to HSL string for Tailwind 4 CSS variables.
 * Format: "H S% L%" or just "H S L" depending on how it's used in globals.css
 * Shadcn/Tailwind 4 typically expects: "H S% L%" or "H S L" as raw numbers.
 */
export function hexToHslValues(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Extracts numeric H, S, L from an HSL string "H S% L%"
 */
export function extractHsl(hslString: string): {
  h: number;
  s: number;
  l: number;
} {
  const matches = hslString.match(/\d+/g);
  if (!matches || matches.length < 3) return { h: 0, s: 0, l: 0 };
  return {
    h: Number(matches[0]),
    s: Number(matches[1]),
    l: Number(matches[2]),
  };
}

/**
 * Generates a 50-900 color scale from a base HEX color.
 */
export function generateColorScale(hex: string) {
  const baseHsl = hexToHslValues(hex);
  const { h, s, l } = extractHsl(baseHsl);

  // Lightness map for 50-900 scale
  // Adjusting based on standard Tailwind scales
  const scale = {
    50: `${h} ${s}% ${Math.min(100, 97)}%`,
    100: `${h} ${s}% ${Math.min(100, 93)}%`,
    200: `${h} ${s}% ${Math.min(100, 86)}%`,
    300: `${h} ${s}% ${Math.min(100, 75)}%`,
    400: `${h} ${s}% ${Math.min(100, 60)}%`,
    500: `${h} ${s}% ${Math.min(100, 52)}%`,
    600: baseHsl, // The base color
    700: `${h} ${s}% ${Math.max(0, l - 10)}%`,
    800: `${h} ${s}% ${Math.max(0, l - 20)}%`,
    900: `${h} ${s}% ${Math.max(0, l - 30)}%`,
  };

  return scale;
}
