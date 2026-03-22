// Helper to parse User-Agent into a friendly string
export function parseUserAgent(ua: string) {
  if (!ua) return "Unknown Device";
  const browser =
    /chrome|firefox|safari|edge|msie|trident/i.exec(ua)?.[0] || "Browser";
  const os =
    /windows|macintosh|iphone|ipad|android|linux/i.exec(ua)?.[0] || "OS";

  // Cleanup
  const cleanBrowser =
    browser.charAt(0).toUpperCase() + browser.slice(1).toLowerCase();
  const cleanOS = os.charAt(0).toUpperCase() + os.slice(1).toLowerCase();

  return `${cleanBrowser} on ${cleanOS}`;
}
