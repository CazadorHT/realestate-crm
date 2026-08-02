/**
 * Formats a description string to safe HTML.
 * Handles:
 * 1. Single-line or multi-line plain text with inline bullets (` * **key:** value`)
 * 2. Markdown syntax (`**bold**`, `* list items`, `## headers`)
 * 3. Already valid HTML content (preserves HTML while formatting embedded markdown syntax like `**bold**`)
 */
export function formatDescriptionToHtml(text: string | null | undefined): string {
  if (!text || !text.trim()) return "";

  let input = text.trim();

  // If text already contains block HTML tags (e.g., <p>, <ul>, <h2>), just format inline markdown
  const hasBlockHtml = /<\/(p|div|ul|ol|li|h[1-6]|table|blockquote)>|<br\s*\/?>/i.test(input);

  if (!hasBlockHtml) {
    // Convert inline markdown bullets (e.g. "text * **key:** val * **key2:** val") into newlines
    input = input.replace(/\s*\*\s+(?=\*\*|[\u0E00-\u0E7F\w])/g, "\n* ");

    // Split into lines
    const lines = input.split(/\r?\n/);
    const resultHtmlLines: string[] = [];
    let inList = false;

    for (let line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        if (inList) {
          resultHtmlLines.push("</ul>");
          inList = false;
        }
        continue;
      }

      // Format inline markdown (bold)
      let formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formattedLine = formattedLine.replace(/__(.*?)__/g, "<strong>$1</strong>");

      // Headers
      if (/^###\s+/.test(formattedLine)) {
        if (inList) { resultHtmlLines.push("</ul>"); inList = false; }
        resultHtmlLines.push(`<h3>${formattedLine.replace(/^###\s+/, "")}</h3>`);
        continue;
      }
      if (/^##\s+/.test(formattedLine)) {
        if (inList) { resultHtmlLines.push("</ul>"); inList = false; }
        resultHtmlLines.push(`<h2>${formattedLine.replace(/^##\s+/, "")}</h2>`);
        continue;
      }
      if (/^#\s+/.test(formattedLine)) {
        if (inList) { resultHtmlLines.push("</ul>"); inList = false; }
        resultHtmlLines.push(`<h1>${formattedLine.replace(/^#\s+/, "")}</h1>`);
        continue;
      }

      // Bullet lists (* item or - item or • item)
      const listMatch = formattedLine.match(/^[\*\-•]\s+(.*)$/);
      if (listMatch) {
        if (!inList) {
          resultHtmlLines.push("<ul>");
          inList = true;
        }
        resultHtmlLines.push(`<li>${listMatch[1]}</li>`);
        continue;
      }

      // Regular line/paragraph
      if (inList) {
        resultHtmlLines.push("</ul>");
        inList = false;
      }
      resultHtmlLines.push(`<p>${formattedLine}</p>`);
    }

    if (inList) {
      resultHtmlLines.push("</ul>");
    }

    return resultHtmlLines.join("");
  }

  // If it already has HTML, format any inline markdown like **bold** that might be inside text nodes
  let formatted = input.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__(.*?)__/g, "<strong>$1</strong>");

  return formatted;
}
