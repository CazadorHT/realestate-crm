import { describe, it, expect } from "vitest";
import { getDealDiff } from "./diff";

describe("getDealDiff - Thai Semantic Localization", () => {
  it("should handle status changes with natural Thai language", () => {
    const oldData = { status: "NEGOTIATING" as any };
    const newData = { status: "CLOSED_WIN" as any };
    const diff = getDealDiff(oldData, newData);

    expect(diff).toContain(
      'เปลี่ยนสถานะจาก "กำลังเจรจาระหว่างรอปิดการขาย" เป็น "ปิดการขายเสร็จสมบูรณ์"',
    );
  });

  it("should handle commission increases with natural Thai language", () => {
    const oldData = { commission_total: 50000 };
    const newData = { commission_total: 75000 };
    const diff = getDealDiff(oldData, newData);

    expect(diff[0]).toContain("ราคาคอมมิชชั่นเพิ่มขึ้นจาก 50,000.00 บาท เป็น 75,000.00 บาท");
  });

  it('should handle setting commission for the first time (null -> value) using "ระบุ"', () => {
    const oldData = { commission_total: 0 };
    const newData = { commission_total: 50000 };
    const diff = getDealDiff(oldData, newData);

    expect(diff[0]).toContain("ระบุยอดคอมมิชชั่นเป็น 50,000.00 บาท");
  });

  it('should handle setting Co-agent for the first time using "ระบุ"', () => {
    const oldData = { co_agent_name: null as any };
    const newData = { co_agent_name: "John Doe" };
    const diff = getDealDiff(oldData, newData);

    expect(diff[0]).toContain('ระบุ Co-agent เป็น "John Doe"');
  });

  it("should handle updating existing Co-agent name", () => {
    const oldData = { co_agent_name: "Old Name" };
    const newData = { co_agent_name: "New Name" };
    const diff = getDealDiff(oldData, newData);

    expect(diff[0]).toContain('แก้ไขชื่อ Co-agent เป็น "New Name"');
  });

  it("should return empty array if no significant changes", () => {
    const oldData = { status: "SIGNED" as any, commission_total: 1000 };
    const newData = { status: "SIGNED" as any, commission_total: 1000 };
    const diff = getDealDiff(oldData, newData);

    expect(diff).toHaveLength(0);
  });
});

describe("getDealDiff - English Semantic Localization", () => {
  it("should handle status changes in English", () => {
    const oldData = { status: "NEGOTIATING" as any };
    const newData = { status: "CLOSED_WIN" as any };
    const diff = getDealDiff(oldData, newData, true);

    expect(diff).toContain('Changed status from "Negotiating" to "Closed (Won)"');
  });

  it("should handle commission changes in English", () => {
    const oldData = { commission_total: 50000 };
    const newData = { commission_total: 75000 };
    const diff = getDealDiff(oldData, newData, true);

    expect(diff[0]).toContain("Increased commission total from ฿50,000.00 to ฿75,000.00");
  });
});
