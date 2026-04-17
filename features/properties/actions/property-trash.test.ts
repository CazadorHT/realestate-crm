import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  softDeleteProperty,
  restoreProperty,
  permanentDeleteProperty,
} from "./property-trash";
import { requireAuthContext } from "@/lib/authz";

// 1. แยก Mock Functions อิสระสำหรับตัวตัดสินผล (Final Executors)
const mockSingle = vi.fn();
const mockUpdateExec = vi.fn(); // สำหรับ .update()...
const mockDeleteExec = vi.fn(); // สำหรับ .delete()...
const mockInsertExec = vi.fn(); // สำหรับ logAudit

// 2. สร้าง Chained Proxy
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockReturnThis(),
    mockResolvedValueOnce: mockUpdateExec, // หลอกให้เรียกได้ใน test (ถ้าจำเป็น)
    then: (resolve: any) => resolve(mockUpdateExec()), // รองรับ await ตรงๆ
  })),
  delete: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockReturnThis(),
    then: (resolve: any) => resolve(mockDeleteExec()),
  })),
  insert: vi.fn().mockImplementation(() => ({
    then: (resolve: any) => resolve(mockInsertExec()),
  })),
  eq: vi.fn().mockReturnThis(),
  single: mockSingle,
};

vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
}));

// Mock logAudit เพื่อไม่ให้ไปกวนการทำงานของ Supabase Mock
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(null),
}));

describe("Property Actions - Trash & Revenue Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    
    // Default success states
    mockUpdateExec.mockResolvedValue({ error: null });
    mockDeleteExec.mockResolvedValue({ error: null });
    mockInsertExec.mockResolvedValue({ error: null });
  });

  describe("softDeleteProperty", () => {
    it("should block non-admin/non-manager from trashing SOLD properties", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "agent-1" },
        role: "AGENT",
        tenantId: "t1",
      });

      mockSingle.mockResolvedValueOnce({
        data: { status: "SOLD", tenant_id: "t1" },
        error: null,
      });

      const result = await softDeleteProperty("p1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("สิทธิ์ไม่เพียงพอ");
    });

    it("should allow Admin to trash SOLD properties", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "admin-1" },
        role: "ADMIN",
        tenantId: "t1",
      });

      mockSingle.mockResolvedValueOnce({
        data: { status: "SOLD", tenant_id: "t1" },
        error: null,
      });
      mockUpdateExec.mockResolvedValueOnce({ error: null });

      const result = await softDeleteProperty("p1");

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should allow Manager to trash SOLD properties", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "manager-1" },
        role: "MANAGER",
        tenantId: "t1",
      });

      mockSingle.mockResolvedValueOnce({
        data: { status: "SOLD", tenant_id: "t1" },
        error: null,
      });
      mockUpdateExec.mockResolvedValueOnce({ error: null });

      const result = await softDeleteProperty("p1");

      expect(result.success).toBe(true);
    });

    it("should enforce tenant isolation for non-admins", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "agent-1" },
        role: "AGENT",
        tenantId: "t1",
      });

      mockSingle.mockResolvedValueOnce({
        data: { status: "ACTIVE", tenant_id: "t1" },
        error: null,
      });
      mockUpdateExec.mockResolvedValueOnce({ error: null });

      await softDeleteProperty("p1");

      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "t1");
    });
  });

  describe("permanentDeleteProperty", () => {
    it("should block non-admin from permanently deleting RENTED properties", async () => {
      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "agent-1" },
        role: "AGENT",
        tenantId: "t1",
      });

      mockSingle.mockResolvedValueOnce({
        data: { status: "RENTED", tenant_id: "t1" },
        error: null,
      });

      const result = await permanentDeleteProperty("p1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("รายการขาย/เช่าสำเร็จ");
    });
  });
});