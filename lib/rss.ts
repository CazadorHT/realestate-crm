import { siteConfig } from "@/lib/site-config";
import { getBlogPosts } from "@/lib/services/blog";

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Generate standard RSS 2.0 Feed XML for VC Connect Asset Blogs
 */
export async function generateRssFeed(feedUrl: string = "/feed.xml"): Promise<string> {
  const baseUrl = siteConfig.url.replace(/\/+$/, "");
  const fullFeedUrl = `${baseUrl}${feedUrl.startsWith("/") ? feedUrl : `/${feedUrl}`}`;

  // Fetch published blog posts (utilizes existing Next.js unstable_cache)
  const posts = await getBlogPosts(undefined, 30, 0);

  const itemsXml = posts
    .map((post) => {
      const postUrl = `${baseUrl}/blog/${post.slug}`;
      const title = post.title || post.title_en || "บทความอสังหาริมทรัพย์";
      const description = post.excerpt || post.excerpt_en || post.content?.slice(0, 200) || "";
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : post.created_at
          ? new Date(post.created_at).toUTCString()
          : new Date().toUTCString();
      const category = post.category ? `<category>${escapeXml(post.category)}</category>` : "";
      const author = post.profiles?.full_name
        ? `<author>${escapeXml(post.profiles.full_name)}</author>`
        : `<author>${escapeXml(siteConfig.name)}</author>`;
      const enclosure = post.cover_image
        ? `<enclosure url="${escapeXml(post.cover_image)}" length="0" type="image/jpeg" />`
        : "";

      return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${category}
      ${author}
      ${enclosure}
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${siteConfig.name} | ข่าวสารและบทความอสังหาริมทรัพย์]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[${siteConfig.description}]]></description>
    <language>th</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${fullFeedUrl}" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/images/branding/vcc-asset/png/logo-dark.png</url>
      <title><![CDATA[${siteConfig.name}]]></title>
      <link>${baseUrl}</link>
    </image>
    ${itemsXml}
  </channel>
</rss>`.trim();
}
