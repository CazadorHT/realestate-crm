import { Deal, DealCommission } from "../types";

/**
 * High-fidelity Thai currency formatter for professional audit logs.
 */
const thaiCurrency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

const formatBaht = (amount: number | null | undefined, isEn: boolean = false) => {
  if (amount === null || amount === undefined || amount === 0) return isEn ? "Not specified" : "ไม่ระบุ";
  return isEn
    ? `฿${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : thaiCurrency.format(amount).replace("฿", "") + " บาท";
};

/**
 * Human-readable status translations (High-quality Thai & English)
 */
const STATUS_LABELS_TH: Record<string, string> = {
  NEGOTIATING: "กำลังเจรจาระหว่างรอปิดการขาย",
  SIGNED: "เซ็นสัญญาเรียบร้อยแล้ว",
  CANCELLED: "ยกเลิกดีล",
  CLOSED_WIN: "ปิดการขายเสร็จสมบูรณ์",
  CLOSED_LOSS: "ปิดดีลไม่สำเร็จ (เสียดีล)",
};

const STATUS_LABELS_EN: Record<string, string> = {
  NEGOTIATING: "Negotiating",
  SIGNED: "Signed Contract",
  CANCELLED: "Cancelled",
  CLOSED_WIN: "Closed (Won)",
  CLOSED_LOSS: "Closed (Lost)",
};

const TYPE_LABELS_TH: Record<string, string> = {
  RENT: "เช่า",
  SALE: "ขาย",
};

const TYPE_LABELS_EN: Record<string, string> = {
  RENT: "Rent",
  SALE: "Sale",
};

/**
 * Semantic Diffing for Deals (Bilingual EN/TH)
 */
export function getDealDiff(
  oldData: Partial<Deal>,
  newData: Partial<Deal>,
  isEn: boolean = false,
): string[] {
  const changes: string[] = [];
  const statusLabels = isEn ? STATUS_LABELS_EN : STATUS_LABELS_TH;
  const typeLabels = isEn ? TYPE_LABELS_EN : TYPE_LABELS_TH;
  const notSpecified = isEn ? "Not specified" : "ไม่ระบุ";

  // 1. Status Change
  if (newData.status && newData.status !== oldData.status) {
    const oldStatus = oldData.status
      ? statusLabels[oldData.status] || oldData.status
      : notSpecified;
    const newStatus = statusLabels[newData.status] || newData.status;
    changes.push(
      isEn
        ? `Changed status from "${oldStatus}" to "${newStatus}"`
        : `เปลี่ยนสถานะจาก "${oldStatus}" เป็น "${newStatus}"`
    );
  }

  // 2. Commission Amount
  if (
    newData.commission_total !== undefined &&
    newData.commission_total !== oldData.commission_total
  ) {
    const oldAmt = oldData.commission_total || 0;
    const newAmt = newData.commission_total || 0;

    if (oldAmt === 0 && newAmt > 0) {
      changes.push(
        isEn
          ? `Set commission total to ${formatBaht(newAmt, isEn)}`
          : `ระบุยอดคอมมิชชั่นเป็น ${formatBaht(newAmt, isEn)}`
      );
    } else if (newAmt > oldAmt) {
      changes.push(
        isEn
          ? `Increased commission total from ${formatBaht(oldAmt, isEn)} to ${formatBaht(newAmt, isEn)}`
          : `ราคาคอมมิชชั่นเพิ่มขึ้นจาก ${formatBaht(oldAmt, isEn)} เป็น ${formatBaht(newAmt, isEn)}`
      );
    } else {
      changes.push(
        isEn
          ? `Reduced commission total from ${formatBaht(oldAmt, isEn)} to ${formatBaht(newAmt, isEn)}`
          : `ปรับลดราคาคอมมิชชั่นจาก ${formatBaht(oldAmt, isEn)} เป็น ${formatBaht(newAmt, isEn)}`
      );
    }
  }

  // 3. Deal Type
  if (newData.deal_type && newData.deal_type !== oldData.deal_type) {
    const oldType = oldData.deal_type
      ? typeLabels[oldData.deal_type] || oldData.deal_type
      : notSpecified;
    const newType = typeLabels[newData.deal_type] || newData.deal_type;
    changes.push(
      isEn
        ? `Changed deal type from "${oldType}" to "${newType}"`
        : `เปลี่ยนประเภทดีลจาก "${oldType}" เป็น "${newType}"`
    );
  }

  // 4. Property Change
  if (newData.property_id && newData.property_id !== oldData.property_id) {
    changes.push(isEn ? "Changed linked property" : "เปลี่ยนทรัพย์สินที่ผูกกับดีล");
  }

  // 5. Co-agent
  if (newData.co_agent_name !== oldData.co_agent_name) {
    if (!oldData.co_agent_name && newData.co_agent_name) {
      changes.push(
        isEn
          ? `Assigned Co-agent "${newData.co_agent_name}"`
          : `ระบุ Co-agent เป็น "${newData.co_agent_name}"`
      );
    } else {
      changes.push(
        isEn
          ? `Updated Co-agent name to "${newData.co_agent_name || notSpecified}"`
          : `แก้ไขชื่อ Co-agent เป็น "${newData.co_agent_name || notSpecified}"`
      );
    }
  }

  return changes;
}

/**
 * Semantic Diffing for Commissions (Bilingual EN/TH)
 */
export function getCommissionDiff(
  oldData: Partial<DealCommission>,
  newData: Partial<DealCommission>,
  isEn: boolean = false,
): string[] {
  const changes: string[] = [];

  if (
    newData.net_amount !== undefined &&
    newData.net_amount !== oldData.net_amount
  ) {
    changes.push(
      isEn
        ? `Updated net commission from ${formatBaht(oldData.net_amount, isEn)} to ${formatBaht(newData.net_amount, isEn)}`
        : `ปรับยอดคอมมิชชั่นสุทธิจาก ${formatBaht(oldData.net_amount, isEn)} เป็น ${formatBaht(newData.net_amount, isEn)}`
    );
  }

  if (newData.status && newData.status !== oldData.status) {
    changes.push(
      isEn
        ? `Changed commission status to "${newData.status}"`
        : `เปลี่ยนสถานะคอมมิชชั่นเป็น "${newData.status}"`
    );
  }

  return changes;
}
