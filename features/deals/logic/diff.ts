import { Deal, DealCommission } from "../types";

/**
 * High-fidelity Thai currency formatter for professional audit logs.
 */
const thaiCurrency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

const formatBaht = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || amount === 0) return "ไม่ระบุ";
  return thaiCurrency.format(amount).replace("฿", "") + " บาท";
};

/**
 * Human-readable status translations (High-quality Thai)
 */
const STATUS_LABELS: Record<string, string> = {
  NEGOTIATING: "กำลังเจรจาระหว่างรอปิดการขาย",
  SIGNED: "เซ็นสัญญาเรียบร้อยแล้ว",
  CANCELLED: "ยกเลิกดีล",
  CLOSED_WIN: "ปิดการขายเสร็จสมบูรณ์",
  CLOSED_LOSS: "ปิดดีลไม่สำเร็จ (เสียดีล)",
};

const TYPE_LABELS: Record<string, string> = {
  RENT: "เช่า",
  SALE: "ขาย",
};

/**
 * Thai Semantic Diffing for Deals
 */
export function getDealDiff(
  oldData: Partial<Deal>,
  newData: Partial<Deal>,
): string[] {
  const changes: string[] = [];

  // 1. Status Change
  if (newData.status && newData.status !== oldData.status) {
    const oldStatus = oldData.status
      ? STATUS_LABELS[oldData.status] || oldData.status
      : "ไม่ระบุ";
    const newStatus = STATUS_LABELS[newData.status] || newData.status;
    changes.push(`เปลี่ยนสถานะจาก "${oldStatus}" เป็น "${newStatus}"`);
  }

  // 2. Commission Amount
  if (
    newData.commission_amount !== undefined &&
    newData.commission_amount !== oldData.commission_amount
  ) {
    const oldAmt = oldData.commission_amount || 0;
    const newAmt = newData.commission_amount || 0;

    if (oldAmt === 0 && newAmt > 0) {
      changes.push(`ระบุยอดคอมมิชชั่นเป็น ${formatBaht(newAmt)}`);
    } else if (newAmt > oldAmt) {
      changes.push(
        `ราคาคอมมิชชั่นเพิ่มขึ้นจาก ${formatBaht(oldAmt)} เป็น ${formatBaht(newAmt)}`,
      );
    } else {
      changes.push(
        `ปรับลดราคาคอมมิชชั่นจาก ${formatBaht(oldAmt)} เป็น ${formatBaht(newAmt)}`,
      );
    }
  }

  // 3. Deal Type
  if (newData.deal_type && newData.deal_type !== oldData.deal_type) {
    const oldType = oldData.deal_type
      ? TYPE_LABELS[oldData.deal_type] || oldData.deal_type
      : "ไม่ระบุ";
    const newType = TYPE_LABELS[newData.deal_type] || newData.deal_type;
    changes.push(`เปลี่ยนประเภทดีลจาก "${oldType}" เป็น "${newType}"`);
  }

  // 4. Property Change
  if (newData.property_id && newData.property_id !== oldData.property_id) {
    changes.push("เปลี่ยนทรัพย์สินที่ผูกกับดีล");
  }

  // 5. Co-agent
  if (newData.co_agent_name !== oldData.co_agent_name) {
    if (!oldData.co_agent_name && newData.co_agent_name) {
      changes.push(`ระบุ Co-agent เป็น "${newData.co_agent_name}"`);
    } else {
      changes.push(
        `แก้ไขชื่อ Co-agent เป็น "${newData.co_agent_name || "ไม่ระบุ"}"`,
      );
    }
  }

  return changes;
}

/**
 * Thai Semantic Diffing for Commissions
 */
export function getCommissionDiff(
  oldData: Partial<DealCommission>,
  newData: Partial<DealCommission>,
): string[] {
  const changes: string[] = [];

  if (
    newData.net_amount !== undefined &&
    newData.net_amount !== oldData.net_amount
  ) {
    changes.push(
      `ปรับยอดคอมมิชชั่นสุทธิจาก ${formatBaht(oldData.net_amount)} เป็น ${formatBaht(newData.net_amount)}`,
    );
  }

  if (newData.status && newData.status !== oldData.status) {
    changes.push(`เปลี่ยนสถานะคอมมิชชั่นเป็น "${newData.status}"`);
  }

  return changes;
}
