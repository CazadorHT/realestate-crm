import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalMockSupabase as mockSupabase } from "@/tests/mocks/supabase";

describe("Services Module - Actions & Queries (เทสโหดๆ แบบไม่อวย)", () => {
  let getServices: any;
  let getServiceBySlug: any;
  let createService: any;
  let updateService: any;
  let deleteService: any;
  let restoreServiceAction: any;
  let permanentDeleteServiceAction: any;
  let incrementServiceViewAction: any;
  let uploadServiceImageAction: any;
  let cleanupOrphanedServiceImagesAction: any;
  let emptyServiceTrashAction: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSupabase.clear();

    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;

    vi.doMock("@/lib/authz", () => ({
      requireAuthContext: vi.fn().mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "u1" },
        role: "ADMIN",
        tenantId: "tenant-1",
      }),
      assertStaff: vi.fn(),
    }));

    vi.doMock("@/lib/actions/tenant-context", () => ({
      getActiveTenantCookie: vi.fn().mockResolvedValue("tenant-1"),
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(mockSupabase),
    }));

    vi.doMock("next/cache", () => ({
      revalidatePath: vi.fn(),
    }));

    const actions = await import("./actions");

    getServices = actions.getServices;
    getServiceBySlug = actions.getServiceBySlug;
    createService = actions.createService;
    updateService = actions.updateService;
    deleteService = actions.deleteService;
    restoreServiceAction = actions.restoreServiceAction;
    permanentDeleteServiceAction = actions.permanentDeleteServiceAction;
    incrementServiceViewAction = actions.incrementServiceViewAction;
    uploadServiceImageAction = actions.uploadServiceImageAction;
    cleanupOrphanedServiceImagesAction = actions.cleanupOrphanedServiceImagesAction;
    emptyServiceTrashAction = actions.emptyServiceTrashAction;
  });

  describe("getServices & getServiceBySlug", () => {
    it("should fetch services with correct mapping", async () => {
      mockSupabase.mockTableResult(
        "cms_content_v3",
        [
          {
            id: "s1",
            slug: "cleaning",
            title: { th: "ทำความสะอาด" },
            content: { th: "รายละเอียด" },
            status: "PUBLISHED",
            meta_data: { sort_order: 1 },
          },
        ],
        1
      );

      const result = await getServices(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("ทำความสะอาด");
      expect(result.count).toBe(1);
    });

    it("should fetch service by slug successfully", async () => {
      mockSupabase.mockTableResult("cms_content_v3", {
        id: "s1",
        slug: "cleaning",
        title: { th: "ทำความสะอาด" },
        status: "PUBLISHED",
      });

      const service = await getServiceBySlug("cleaning");
      expect(service).not.toBeNull();
      expect(service!.title).toBe("ทำความสะอาด");
    });
  });

  describe("createService & updateService", () => {
    it("should create service successfully", async () => {
      mockSupabase
        .mockTableResult("cms_content_v3", { id: "s1" }) // insert
        .mockTableResult("activity_timeline_v3", { success: true }); // audit

      const input = {
        slug: "cleaning",
        title: "ทำความสะอาด",
        content: "รายละเอียด",
        is_active: true,
      };

      const result = await createService(input);
      expect(result.success).toBe(true);
    });

    it("should update service successfully", async () => {
      mockSupabase
        .mockTableResult("cms_content_v3", { title: { th: "Old" }, status: "DRAFT" }) // select old
        .mockTableResult("cms_content_v3", { success: true }) // update
        .mockTableResult("activity_timeline_v3", { success: true }); // audit

      const input = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "ทำความสะอาดใหม่",
      };

      const result = await updateService(input);
      expect(result.success).toBe(true);
    });
  });

  describe("deleteService, restoreService & permanentDeleteService", () => {
    it("should soft delete service", async () => {
      mockSupabase
        .mockTableResult("cms_content_v3", { success: true })
        .mockTableResult("activity_timeline_v3", { success: true });

      const result = await deleteService("s1");
      expect(result.success).toBe(true);
    });

    it("should restore service", async () => {
      mockSupabase
        .mockTableResult("cms_content_v3", { success: true })
        .mockTableResult("activity_timeline_v3", { success: true });

      const result = await restoreServiceAction("s1");
      expect(result.success).toBe(true);
    });

    it("should permanent delete service and cleanup storage", async () => {
      mockSupabase
        .mockTableResult("cms_content_v3", {
          title: "A",
          cover_image: "http://img.com/service-images/cover.jpg",
          meta_data: { gallery_images: ["http://img.com/service-images/g1.jpg"] },
        }) // select
        .mockTableResult("cms_content_v3", { success: true }) // delete
        .mockTableResult("activity_timeline_v3", { success: true }); // audit

      mockSupabase.storage.from("service-images").remove.mockResolvedValue({ data: [], error: null });

      const result = await permanentDeleteServiceAction("s1");
      expect(result.success).toBe(true);
      expect(mockSupabase.storage.from("service-images").remove).toHaveBeenCalledWith(["cover.jpg", "g1.jpg"]);
    });
  });

  describe("incrementServiceViewAction", () => {
    it("should increment service view via rpc", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await incrementServiceViewAction("s1", "u1", "ip1", "agent1");
      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("increment_service_view", expect.any(Object));
    });
  });

  describe("uploadServiceImageAction", () => {
    it("should upload image successfully", async () => {
      mockSupabase.storage.from("service-images").upload.mockResolvedValue({ data: { path: "p" }, error: null });
      mockSupabase.storage.from("service-images").getPublicUrl.mockReturnValue({ data: { publicUrl: "http://img.com/p" } });

      const formData = new FormData();
      formData.append("file", new File(["test"], "test.png", { type: "image/png" }));

      const result = await uploadServiceImageAction(formData);
      expect(result.success).toBe(true);
      expect(result.data?.publicUrl).toBe("http://img.com/p");
    });
  });

  describe("cleanupOrphanedServiceImagesAction & emptyServiceTrashAction", () => {
    it("should cleanup orphaned images successfully", async () => {
      mockSupabase
        .mockTableResult("activity_timeline_v3", [
          { id: "log1", metadata: { files: ["orphan.jpg"] } },
        ]) // select
        .mockTableResult("activity_timeline_v3", { success: true }); // delete log

      mockSupabase.storage.from("service-images").remove.mockResolvedValue({ data: [], error: null });

      const result = await cleanupOrphanedServiceImagesAction();
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it("should empty service trash successfully", async () => {
      mockSupabase
        .mockTableResult("cms_content_v3", [
          { id: "s1", cover_image: "http://img.com/service-images/trash1.jpg", meta_data: {} },
        ]) // select trash
        .mockTableResult("cms_content_v3", { success: true }) // delete
        .mockTableResult("activity_timeline_v3", { success: true }); // audit

      mockSupabase.storage.from("service-images").remove.mockResolvedValue({ data: [], error: null });

      const result = await emptyServiceTrashAction();
      expect(result.success).toBe(true);
      expect(mockSupabase.storage.from("service-images").remove).toHaveBeenCalledWith(["trash1.jpg"]);
    });
  });
});
