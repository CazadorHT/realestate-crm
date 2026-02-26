/**
 * Simple template engine to replace {{placeholders}} with data.
 * Supports nested access like {{lead.full_name}}
 */
export function replacePlaceholders(content: string, data: any): string {
  if (!content) return "";
  return content.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const keys = key.trim().split(".");
    let value = data;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Log missing key for debugging but return empty in document
        console.warn(
          `Template Engine: Missing key "${key.trim()}" in provided data.`,
        );
        return "";
      }
    }

    return value !== null && value !== undefined ? String(value) : "";
  });
}

/**
 * Format currency for templates
 */
export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "0.00";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for templates (Thai style)
 */
export function formatDateThai(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return "-";
  }
}
