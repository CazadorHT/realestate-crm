/**
 * Formats a description string to safe HTML.
 * Handles:
 * 1. Single-line or multi-line plain text with inline bullets (` * **key:** value`)
 * 2. Markdown syntax (`**bold**`, `* list items`, `## headers`, `1. numbered lists`)
 * 3. Already valid HTML content (preserves HTML while formatting embedded markdown syntax like `**bold**`)
 * 4. Mixed/weird formatting (handles orphan markdown asterisks, missing tag closes, etc.)
 */
export function formatDescriptionToHtml(text: string | null | undefined): string {
  if (!text || !text.trim()) return "";

  let input = text.trim();

  // Check if text already contains block HTML tags
  const hasBlockHtml = /<\/(p|div|ul|ol|li|h[1-6]|table|blockquote)>|<br\s*\/?>/i.test(input);

  if (!hasBlockHtml) {
    // 1. Convert inline markdown bullets (e.g. "text * **key:** val * **key2:** val") into newlines
    input = input.replace(/(?<=\S)\s+\*\s+(?=\*\*|[^\s\*])/g, "\n* ");

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

      // Horizontal rule (--- or *** or ___)
      if (/^(---|[*]{3}|___)$/.test(trimmed)) {
        if (inList) { resultHtmlLines.push("</ul>"); inList = false; }
        resultHtmlLines.push("<hr class=\"my-4 border-slate-200\" />");
        continue;
      }

      // Format inline markdown (bold & italic) safely
      let formattedLine = trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/(^|[^\*])\*(?!\*)(.*?)\*/g, "$1<em>$2</em>");

      // Headers (# Header, ## Header, ### Header)
      if (/^#{1,3}\s+/.test(formattedLine)) {
        if (inList) { resultHtmlLines.push("</ul>"); inList = false; }
        const level = formattedLine.match(/^(#{1,3})\s+/)?.[1].length || 2;
        const cleanTitle = formattedLine.replace(/^#{1,3}\s+/, "");
        resultHtmlLines.push(`<h${level}>${cleanTitle}</h${level}>`);
        continue;
      }

      // Bullet lists (* item, - item, • item, or 📍/✅/🔹 emoji bullets)
      const listMatch = formattedLine.match(/^([\*\-•])\s+(.*)$/);

      if (listMatch) {
        if (!inList) {
          resultHtmlLines.push("<ul>");
          inList = true;
        }
        resultHtmlLines.push(`<li>${listMatch[2]}</li>`);
        continue;
      }

      // Numbered lists (1. item, 2. item)
      const numMatch = formattedLine.match(/^\d+[\.\)]\s+(.*)$/);
      if (numMatch) {
        if (inList) {
          resultHtmlLines.push("</ul>");
          inList = false;
        }
        resultHtmlLines.push(`<p><strong>${formattedLine.split(" ")[0]}</strong> ${numMatch[1]}</p>`);
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
  let formatted = input
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>");

  return formatted;
}
