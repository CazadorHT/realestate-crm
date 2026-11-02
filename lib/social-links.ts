/**
 * Shared helpers for formatting company social media & messaging links.
 * Safe for both Server and Client Components.
 */

export function buildLineUrl(
  lineUrl?: string | null,
  lineId?: string | null,
): string {
  const trimmedUrl = lineUrl?.trim() || "";
  if (trimmedUrl) {
    return trimmedUrl;
  }

  const trimmedId = lineId?.trim() || "";
  if (!trimmedId) {
    return "";
  }

  if (trimmedId.startsWith("http://") || trimmedId.startsWith("https://")) {
    return trimmedId;
  }

  if (trimmedId.startsWith("@")) {
    return `https://line.me/R/ti/p/${encodeURIComponent(trimmedId)}`;
  }

  return `https://line.me/ti/p/~${encodeURIComponent(trimmedId)}`;
}

export function buildWhatsAppUrl(rawPhoneOrUrl?: string | null): string {
  const trimmed = rawPhoneOrUrl?.trim() || "";
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const cleaned = trimmed.replace(/\D/g, "");
  if (cleaned.length < 7) {
    return "";
  }

  // Convert local Thai mobile/landline leading 0 (e.g. 0812345678 -> 66812345678)
  const formatted =
    cleaned.startsWith("0") && (cleaned.length === 9 || cleaned.length === 10)
      ? `66${cleaned.slice(1)}`
      : cleaned;

  return `https://wa.me/${formatted}`;
}
