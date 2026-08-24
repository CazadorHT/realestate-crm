import { describe, it, expect, vi } from "vitest";
import { generateRssFeed } from "./rss";

vi.mock("@/lib/services/blog", () => ({
  getBlogPosts: vi.fn().mockResolvedValue([
    {
      id: "b1",
      slug: "test-condo-guide-2026",
      title: "คู่มือเลือกซื้อคอนโด 2026",
      title_en: "Condo Buying Guide 2026",
      excerpt: "บทความแนะนำการเลือกซื้อคอนโดติดรถไฟฟ้า",
      published_at: "2026-08-20T10:00:00.000Z",
      category: "Guide",
      cover_image: "https://cdn.vccasset.com/blog/cover1.jpg",
      profiles: { full_name: "Admin Team" },
    },
  ]),
}));

describe("RSS Feed Generation (SEO & Crawlers)", () => {
  it("should generate valid RSS 2.0 XML structure with correct channel and items", async () => {
    const xml = await generateRssFeed("/feed.xml");

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("คู่มือเลือกซื้อคอนโด 2026");
    expect(xml).toContain("/blog/test-condo-guide-2026");
    expect(xml).toContain("<category>Guide</category>");
    expect(xml).toContain("<author>Admin Team</author>");
    expect(xml).toContain('type="application/rss+xml"');
  });
});
