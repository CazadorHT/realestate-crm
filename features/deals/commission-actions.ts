"use server";

import {
  generateCommissionPdf,
  CommissionStatementData,
} from "@/lib/finance/commission-pdf";
import { buildCommissionStatementFlex } from "@/lib/line-flex-builders";
import { format } from "date-fns";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { getScopedRevenueClient } from "./logic/scoped-client";
import { Database } from "@/lib/database.types.generated";
import { decrypt } from "@/lib/crypto";

export type LineSendResult = {
  success: boolean;
  message: string;
};

// 💎 Hardened Type Definition representing the exact joined result from Supabase
type CommissionWithRelations = Database["public"]["Tables"]["crm_deal_commissions_v3"]["Row"] & {
  deal?: { title: string } | null;
  agent?: { 
    display_name?: string | null; 
    line_id?: string | null; 
    social_links?: Record<string, unknown> | null; 
  } | null;
};

export async function exportCommissionPdfAction(commissionId: string) {
  try {
    if (!commissionId || typeof commissionId !== "string") {
      return { success: false, message: "รหัสคอมมิชชั่นไม่ถูกต้อง (Invalid Commission ID)" };
    }

    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;
    if (!tenantId) return { success: false, message: "Unauthorized branch" };
    assertStaff(role);

    const scoped = getScopedRevenueClient(supabase, tenantId);

    const { data: rawComm, error } = await scoped
      .commissions()
      .select(`
        *,
        deal:crm_deals_v3(title),
        agent:identities_v3(display_name)
      `)
      .eq("id", commissionId)
      .single();

    if (error || !rawComm) {
      return { success: false, message: "ไม่พบข้อมูลคอมมิชชั่น (Commission record not found)" };
    }
    const comm = rawComm as unknown as CommissionWithRelations;

    const agentDisp = comm.agent?.display_name;
    const agentName = decrypt(agentDisp) || agentDisp || "Agent";

    const pdfData: CommissionStatementData = {
      dealId: comm.deal_id || "",
      dealTitle: comm.deal?.title || "Untitled Deal",
      agentName: agentName,
      role: comm.recipient_role,
      percentage: comm.percentage || 0,
      grossAmount: comm.amount || 0,
      whtAmount: comm.tax_amount || 0,
      netAmount: comm.net_amount || 0,
      date: format(new Date(), "dd/MM/yyyy"),
    };

    const pdfBytes = await generateCommissionPdf(pdfData);
    
    // Audit log
    const amountStr = new Intl.NumberFormat('th-TH').format(comm.net_amount || 0) + " บาท";

    await logAudit(ctx, {
      action: "commission.export_pdf",
      entity: "crm_deal_commissions_v3",
      entityId: commissionId,
      summary: `ส่งออกใบสำคัญรับเงิน PDF สำหรับคุณ ${agentName} (ยอดสุทธิ ${amountStr})`,
      metadata: { dealId: comm.deal_id, amount: comm.net_amount },
    });

    // Convert to base64 for transmission
    const base64 = Buffer.from(pdfBytes).toString("base64");

    return {
      success: true,
      data: base64,
      filename: `Commission_${pdfData.agentName.replace(/\s+/g, "_")}_${comm.deal_id?.slice(0, 5) || "deal"}.pdf`,
    };
  } catch (err) {
    console.error("PDF Export Error:", err);
    return authzFail(err);
  }
}

export async function sendCommissionToLineAction(commissionId: string) {
  try {
    if (!commissionId || typeof commissionId !== "string") {
      return { success: false, message: "รหัสคอมมิชชั่นไม่ถูกต้อง (Invalid Commission ID)" };
    }

    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;
    if (!tenantId) return { success: false, message: "Unauthorized branch" };
    assertStaff(role);

    const scoped = getScopedRevenueClient(supabase, tenantId);

    const { data: rawComm, error } = await scoped
      .commissions()
      .select(`
        *,
        deal:crm_deals_v3(title),
        agent:identities_v3(display_name, line_id, social_links)
      `)
      .eq("id", commissionId)
      .single();

    if (error || !rawComm) {
      return { success: false, message: "ไม่พบข้อมูลคอมมิชชั่น (Commission record not found)" };
    }
    const comm = rawComm as unknown as CommissionWithRelations;

    const agent = comm.agent;
    const social = (agent?.social_links as Record<string, unknown>) || {};
    const lineUserId = typeof social.line_user_id === "string" ? social.line_user_id : undefined;
    const lineId = decrypt(agent?.line_id) || agent?.line_id || lineUserId;
    const agentDisp = agent?.display_name;
    const agentName = decrypt(agentDisp) || agentDisp || "Agent";

    if (!lineId) {
      return { success: false, message: "ตัวแทนยังไม่ได้เชื่อมต่อบัญชี LINE (Agent has no linked LINE account)" };
    }

    const flexMessage = buildCommissionStatementFlex({
      dealTitle: comm.deal?.title || "Untitled Deal",
      agentName: agentName,
      role: comm.recipient_role,
      grossAmount: comm.amount || 0,
      whtAmount: comm.tax_amount || 0,
      netAmount: comm.net_amount || 0,
      date: format(new Date(), "dd/MM/yyyy"),
    });

    const result = await sendToSpecificLineUser(lineId, flexMessage);
    
    if (result.success) {
      const amountStr = new Intl.NumberFormat('th-TH').format(comm.net_amount || 0) + " บาท";
      
      await logAudit(ctx, {
        action: "commission.send_line",
        entity: "crm_deal_commissions_v3",
        entityId: commissionId,
        summary: `ส่งการแจ้งเตือนคอมมิชชั่นผ่าน LINE ให้คุณ ${agentName} (ยอดสุทธิ ${amountStr})`,
        metadata: { dealId: comm.deal_id, userId: lineId, amount: comm.net_amount },
      });
    }

    return result;
  } catch (err) {
    console.error("LINE Send Error:", err);
    return authzFail(err);
  }
}

async function sendToSpecificLineUser(to: string, message: object) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { success: false, message: "ระบบยังไม่ได้ตั้งค่า LINE Token (LINE token not configured)" };

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: to,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        message: `LINE API Error: ${JSON.stringify(err)}`,
      };
    }

    return { success: true, message: "ส่งข้อความเข้า LINE สำเร็จ (Sent successfully to LINE)" };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE API (Network error sending to LINE)" };
  }
}
