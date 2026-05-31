import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  softDeleteProperty,
  permanentDeleteProperty,
} from "./property-trash";

// 🛠️ ต้องดึงrequireAuthContext มาเพื่อใช้ vi.mocked() ในเคสด้านล่าง
import { requireAuthContext } from "@/lib/authz";

// 1. แยก Mock Functions อิสระสำหรับตัวตัดสินผล
const mockSingle = vi.fn();
const mockUpdateExec = vi.fn();
const mockDeleteExec = vi.fn();

// 2. สร้าง Chained Proxy
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockReturnThis(),
    mockResolvedValueOnce: mockUpdateExec,
    then: (resolve: any) => resolve(mockUpdateExec()),
  })),
  delete: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockReturnThis(),
    then: (resolve: any) => resolve(mockDeleteExec()),
  })),
  eq: vi.fn().mockReturnThis(),
  single: mockSingle,
};

// 3. Mock Modules
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/db-error", () => ({
  mapDbError: vi.fn((e) => e.message || "DB Error"),
}));

vi.mock("../labels", () => ({
  getStatusFromDb: vi.fn((val) => val), // ส่งค่ากลับไปตรงๆ
}));

describe("Property Actions - Trash & Revenue Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    
    mockUpdateExec.mockResolvedValue({ error: null });
    mockDeleteExec.mockResolvedValue({ error: null });
  });

  describe("softDeleteProperty", () => {
    it("should block non-admin/non-manager from trashing SOLD properties", async () => {
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "agent-1" } as any, // 🛠️ หลบ TS error
        role: "AGENT",
        tenantId: "t1",
      } as any);

      // 🛠️ ให้ AGENT เป็นเจ้าของทรัพย์ เพื่อผ่านเงื่อนไข isOwner ไปเช็ค Revenue Protection
      mockSingle.mockResolvedValueOnce({
        data: { status: "SOLD", tenant_id: "t1", created_by: "agent-1" },
        error: null,
      });

      const result = await softDeleteProperty("p1");

      expect(result.success).toBe(false);
      // 🛠️ ตรวจจับคำว่า 'สิทธิ์ไม่เพียงพอ' ตามที่โค้ดจริงส่งออกมา
      expect(result.error).toContain("สิทธิ์ไม่เพียงพอ");
    });

    it("should allow Admin to trash SOLD properties", async () => {
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "admin-1" } as any,
        role: "ADMIN",
        tenantId: "t1",
      } as any);

      mockSingle.mockResolvedValueOnce({
        data: { status: "SOLD", tenant_id: "t1", created_by: "agent-1" },
        error: null,
      });
      
      const result = await softDeleteProperty("p1");

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should allow Manager to trash SOLD properties", async () => {
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "manager-1" } as any,
        role: "MANAGER",
        tenantId: "t1",
      } as any);

      mockSingle.mockResolvedValueOnce({
        data: { status: "SOLD", tenant_id: "t1", created_by: "agent-1" },
        error: null,
      });

      const result = await softDeleteProperty("p1");

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should enforce tenant isolation for non-admins", async () => {
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "agent-1" } as any,
        role: "AGENT",
        tenantId: "t1",
      } as any);

      // 🛠️ จำลองให้เป็นทรัพย์สถานะปกติ และ AGENT เป็นเจ้าของ
      mockSingle.mockResolvedValueOnce({
        data: { status: "ACTIVE", tenant_id: "t1", created_by: "agent-1" },
        error: null,
      });

      await softDeleteProperty("p1");

      // 🛠️ โค้ดจริงของคุณมีการ check eq("tenant_id", tenantId) ทั้งหมด 2 ครั้ง 
      // (รอบดึงข้อมูล และรอบอัปเดต)
      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "t1");
    });
  });

  describe("permanentDeleteProperty", () => {
    it("should block non-admin from permanently deleting RENTED properties", async () => {
      vi.mocked(requireAuthContext).mockResolvedValue({
        supabase: mockSupabase,
        user: { id: "agent-1" } as any,
        role: "AGENT",
        tenantId: "t1",
      } as any);

      // 🛠️ ให้ AGENT เป็นเจ้าของทรัพย์ เพื่อผ่านเงื่อนไขแรก
      mockSingle.mockResolvedValueOnce({
        data: { status: "RENTED", tenant_id: "t1", created_by: "agent-1" },
        error: null,
      });

      const result = await permanentDeleteProperty("p1");

      expect(result.success).toBe(false);
      // 🛠️ โค้ดจริงมีคำว่า "รายการขาย/เช่าสำเร็จ" อยู่ใน Error Message
      expect(result.error).toContain("รายการขาย/เช่าสำเร็จ");
    });
  });
});