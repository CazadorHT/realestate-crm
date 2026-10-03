import { describe, it, expect, vi, beforeEach } from "vitest";
import { postPropertyToMetaAction } from "./social";
import { postToMetaPage } from "@/lib/meta";
import { requireAuthContext } from "@/lib/authz";

// Mocks
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/meta", () => ({
  postToMetaPage: vi.fn(),
  getActiveMetaAccount: vi.fn(),
}));

vi.mock("@/lib/tiktok", () => ({
  getTikTokToken: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/features/site-settings/actions", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    facebook_post_template: "Title: {{title}}\nPrice: {{price}}\nType: {{listing_type}}\nLink: {{link}}",
    meta_page_name: "Test Page",
  }),
}));

describe("Social Dual Post & User Error Test Suite", () => {
  const mockPropertyId = "prop-dual-123";
  const mockSaleCover = "https://cdn.vccasset.com/storage/v1/object/public/property-images/social-covers/sale_cover.jpg";
  const mockRentCover = "https://cdn.vccasset.com/storage/v1/object/public/property-images/social-covers/rent_cover.jpg";
  const mockPhoto1 = "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo1.jpg";
  const mockPhoto2 = "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo2.jpg";

  const createMockProperty = (overrides = {}) => ({
    id: mockPropertyId,
    slug: "luxury-pool-villa",
    title: "Luxury Pool Villa",
    listing_type: "SALE_AND_RENT",
    price: 42950000,
    rental_price: 400000,
    property_images: [
      { image_url: mockPhoto1, storage_path: "photo1.jpg", is_cover: true, sort_order: 1 },
      { image_url: mockPhoto2, storage_path: "photo2.jpg", is_cover: false, sort_order: 2 },
    ],
    property_agents: [],
    property_features: [],
    ...overrides,
  });

  const createMockSupabase = (propertyData: any) => {
    return {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: propertyData, error: propertyData ? null : new Error("Property not found") }),
      limit: vi.fn().mockReturnThis(),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Dual Post Isolation (Sale vs Rent)", () => {
    it("should generate pure Sale post with Sale cover, Sale price, and sale_post UTM", async () => {
      const mockSupabase = createMockSupabase(createMockProperty());
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
      });

      vi.mocked(postToMetaPage).mockResolvedValue({
        success: true,
        data: { id: "fb_post_sale_1" },
      });

      const res = await postPropertyToMetaAction(
        mockPropertyId,
        "FACEBOOK",
        undefined, // default template
        "th",
        mockSaleCover,
        "acc_1",
        "SALE"
      );

      expect(res.success).toBe(true);
      expect(postToMetaPage).toHaveBeenCalledTimes(1);

      const [content, images] = vi.mocked(postToMetaPage).mock.calls[0] as [string, string[]];
      // 1. Must use Sale cover as Image #1
      expect(images[0]).toBe(mockSaleCover);
      // 2. Must NOT include Rent cover
      expect(images).not.toContain(mockRentCover);
      // 3. Must include Sale price
      expect(content).toContain("42,950,000");
      // 4. Must include sale_post UTM
      expect(content).toContain("utm_campaign=sale_post");
    });

    it("should generate pure Rent post with Rent cover, Rent price, and rent_post UTM", async () => {
      const mockSupabase = createMockSupabase(createMockProperty());
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
      });

      vi.mocked(postToMetaPage).mockResolvedValue({
        success: true,
        data: { id: "fb_post_rent_1" },
      });

      const res = await postPropertyToMetaAction(
        mockPropertyId,
        "FACEBOOK",
        undefined,
        "th",
        mockRentCover,
        "acc_1",
        "RENT"
      );

      expect(res.success).toBe(true);
      expect(postToMetaPage).toHaveBeenCalledTimes(1);

      const [content, images] = vi.mocked(postToMetaPage).mock.calls[0] as [string, string[]];
      // 1. Must use Rent cover as Image #1
      expect(images[0]).toBe(mockRentCover);
      // 2. Must NOT include Sale cover
      expect(images).not.toContain(mockSaleCover);
      // 3. Must include Rent price
      expect(content).toContain("400,000");
      // 4. Must include rent_post UTM
      expect(content).toContain("utm_campaign=rent_post");
    });
  });

  describe("2. User Error & Edge Cases", () => {
    it("User Error Case A: Property does not exist in database", async () => {
      const mockSupabase = createMockSupabase(null);
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
      });

      const res = await postPropertyToMetaAction(
        "invalid-prop-id",
        "FACEBOOK",
        undefined,
        "th",
        undefined,
        undefined,
        "SALE"
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("ไม่พบข้อมูลอสังหาริมทรัพย์");
      expect(postToMetaPage).not.toHaveBeenCalled();
    });

    it("User Error Case B: User sets Sale cover but leaves Rent cover empty (Graceful Fallback)", async () => {
      const mockSupabase = createMockSupabase(createMockProperty());
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
      });

      vi.mocked(postToMetaPage).mockResolvedValue({
        success: true,
        data: { id: "fb_post_rent_fallback" },
      });

      // Post Rent with undefined cover
      const res = await postPropertyToMetaAction(
        mockPropertyId,
        "FACEBOOK",
        undefined,
        "th",
        undefined, // User didn't upload rent cover
        "acc_1",
        "RENT"
      );

      expect(res.success).toBe(true);
      const [, images] = vi.mocked(postToMetaPage).mock.calls[0] as [string, string[]];
      // Must NOT leak Sale cover into Rent post
      expect(images).not.toContain(mockSaleCover);
      // Should use property's original photos
      expect(images.length).toBeGreaterThan(0);
      expect(images[0]).toContain("photo1.jpg");
    });

    it("User Error Case C: Meta API error (Token expired / Page permission error)", async () => {
      const mockSupabase = createMockSupabase(createMockProperty());
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
      });

      vi.mocked(postToMetaPage).mockResolvedValue({
        success: false,
        error: "Session has expired or token is invalid",
      });

      const res = await postPropertyToMetaAction(
        mockPropertyId,
        "FACEBOOK",
        undefined,
        "th",
        mockSaleCover,
        "acc_1",
        "SALE"
      );

      // Should return error response gracefully without crashing
      expect(res.success).toBe(false);
      expect(res.message).toContain("Session has expired or token is invalid");
    });

    it("User Error Case D: Leftover social-covers from prior sessions must not leak into post", async () => {
      // Suppose property_images in database had a leftover social cover from an old run
      const leftoverCover = "https://cdn.vccasset.com/storage/v1/object/public/property-images/social-covers/prop-dual-123/old_cover.jpg";
      const propWithLeftover = createMockProperty({
        property_images: [
          { image_url: leftoverCover, storage_path: "social-covers/prop-dual-123/old_cover.jpg", is_cover: true, sort_order: 1 },
          { image_url: mockPhoto1, storage_path: "photo1.jpg", is_cover: false, sort_order: 2 },
        ],
      });

      const mockSupabase = createMockSupabase(propWithLeftover);
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase as any,
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
      });

      vi.mocked(postToMetaPage).mockResolvedValue({
        success: true,
        data: { id: "fb_post_clean" },
      });

      await postPropertyToMetaAction(
        mockPropertyId,
        "FACEBOOK",
        undefined,
        "th",
        mockRentCover,
        "acc_1",
        "RENT"
      );

      const [, images] = vi.mocked(postToMetaPage).mock.calls[0] as [string, string[]];
      // Active rent cover is first
      expect(images[0]).toBe(mockRentCover);
      // Leftover old social-covers is filtered out!
      expect(images).not.toContain(leftoverCover);
    });
  });

  describe("3. Upload Cover API Route (/api/upload-cover) User Errors", () => {
    it("User Error Case E: Upload Cover API rejects payload missing file and base64DataUrl", async () => {
      const { POST } = await import("@/app/api/upload-cover/route");
      vi.mocked(requireAuthContext).mockResolvedValue({
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
        supabase: {} as any,
      });

      const badReq = new Request("http://localhost:3000/api/upload-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: mockPropertyId }), // missing image
      });

      const response = await POST(badReq);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid image payload");
    });

    it("User Error Case G: Upload Cover API rejects file exceeding 20MB", async () => {
      const { POST } = await import("@/app/api/upload-cover/route");
      vi.mocked(requireAuthContext).mockResolvedValue({
        user: { id: "user-1" } as any,
        role: "ADMIN" as any,
        supabase: {} as any,
      });

      // Simulate base64 exceeding 20MB (21MB binary = ~28MB base64)
      const oversizedBuffer = Buffer.alloc(21 * 1024 * 1024).toString("base64");
      const badReq = new Request("http://localhost:3000/api/upload-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: mockPropertyId,
          base64DataUrl: `data:image/jpeg;base64,${oversizedBuffer}`,
        }),
      });

      const response = await POST(badReq);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain("ขนาดไฟล์ใหญ่เกินไป");
    });

    it("User Error Case H: Dual Post Batch partial failure reporting", () => {
      // Simulate postResults logic from SocialPostDialog handlePost
      const postResults = [
        { label: "โพสต์ขาย (Vcc Asset)", success: true },
        { label: "โพสต์เช่า (Vcc Asset)", success: false, message: "Page access token expired" },
      ];

      const allSuccess = postResults.every((r) => r.success);
      const anySuccess = postResults.some((r) => r.success);
      const summaryMsg = postResults
        .map((r) => `${r.success ? "✅" : "❌"} ${r.label}${r.message ? `: ${r.message}` : ""}`)
        .join(" | ");

      expect(allSuccess).toBe(false);
      expect(anySuccess).toBe(true);
      expect(summaryMsg).toBe("✅ โพสต์ขาย (Vcc Asset) | ❌ โพสต์เช่า (Vcc Asset): Page access token expired");
    });
  });
});
