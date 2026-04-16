"use server";

import {
  generateCommissionPdf,
  CommissionStatementData,
} from "@/lib/finance/commission-pdf";
import { buildCommissionStatementFlex } from "@/lib/line-flex-builders";
import { format } from "date-fns";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { getScopedRevenueClient } from "./logic/scoped-client";
import { DealCommission } from "./types";

export type LineSendResult = {
  success: boolean;
  message: string;
};

export async function exportCommissionPdfAction(commissionId: string) {
  const ctx = await requireAuthContext();
  const { supabase, tenantId, role } = ctx;
  if (!tenantId) return { success: false, message: "Unauthorized branch" };
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);

  const { data: comm, error } = await scoped
    .commissions()
    .select(
      `
      *,
      deal:deals(title),
      agent:profiles(full_name)
    `,
    )
    .eq("id", commissionId)
    .single();

  if (error || !comm) {
    return { success: false, message: "Commission record not found" };
  }

  const pdfData: CommissionStatementData = {
    dealId: comm.deal_id,
    dealTitle: (comm.deal as any)?.title || "Untitled Deal",
    agentName: (comm.agent as any)?.full_name || "Agent",
    role: comm.role,
    percentage: comm.percentage,
    grossAmount: comm.amount,
    whtAmount: comm.wht_amount,
    netAmount: comm.net_amount,
    date: format(new Date(), "dd/MM/yyyy"),
  };

  try {
    const pdfBytes = await generateCommissionPdf(pdfData);
    
    // Audit log
    const agentName = (comm as any).agent?.full_name || "Agent";
    const amountStr = new Intl.NumberFormat('th-TH').format(comm.net_amount) + " บาท";

    await logAudit(ctx, {
      action: "commission.export_pdf",
      entity: "deal_commissions",
      entityId: commissionId,
      summary: `ส่งออกใบสำคัญรับเงิน PDF สำหรับคุณ ${agentName} (ยอดสุทธิ ${amountStr})`,
      metadata: { dealId: comm.deal_id, amount: comm.net_amount },
    });

    // Convert to base64 for transmission
    const base64 = Buffer.from(pdfBytes).toString("base64");

    return {
      success: true,
      data: base64,
      filename: `Commission_${pdfData.agentName.replace(/\s+/g, "_")}_${comm.deal_id.slice(0, 5)}.pdf`,
    };
  } catch (err) {
    console.error("PDF Export Error:", err);
    return { success: false, message: "Failed to generate PDF" };
  }
}

export async function sendCommissionToLineAction(commissionId: string) {
  const ctx = await requireAuthContext();
  const { supabase, tenantId, role } = ctx;
  if (!tenantId) return { success: false, message: "Unauthorized branch" };
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);

  const { data: comm, error } = await scoped
    .commissions()
    .select(
      `
      *,
      deal:deals(title),
      agent:profiles(full_name, line_user_id, line_id)
    `,
    )
    .eq("id", commissionId)
    .single();

  if (error || !comm) {
    return { success: false, message: "Commission record not found" };
  }

  const agent = comm.agent as any;
  const lineId = agent?.line_user_id || agent?.line_id;

  if (!lineId) {
    return { success: false, message: "Agent has no linked LINE account" };
  }

  const flexMessage = buildCommissionStatementFlex({
    dealTitle: (comm.deal as any)?.title || "Untitled Deal",
    agentName: agent?.full_name || "Agent",
    role: comm.role,
    grossAmount: comm.amount,
    whtAmount: comm.wht_amount,
    netAmount: comm.net_amount,
    date: format(new Date(), "dd/MM/yyyy"),
  });

  try {
    const result = await sendToSpecificLineUser(lineId, flexMessage);
    
    if (result.success) {
      const agentName = (comm as any).agent?.full_name || "Agent";
      const amountStr = new Intl.NumberFormat('th-TH').format(comm.net_amount) + " บาท";
      
      await logAudit(ctx, {
        action: "commission.send_line",
        entity: "deal_commissions",
        entityId: commissionId,
        summary: `ส่งการแจ้งเตือนคอมมิชชั่นผ่าน LINE ให้คุณ ${agentName} (ยอดสุทธิ ${amountStr})`,
        metadata: { dealId: comm.deal_id, userId: lineId, amount: comm.net_amount },
      });
    }

    return result;
  } catch (err) {
    console.error("LINE Send Error:", err);
    return { success: false, message: "Failed to send to LINE" };
  }
}

async function sendToSpecificLineUser(to: string, message: any) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { success: false, message: "LINE token not configured" };

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

    return { success: true, message: "Sent successfully to LINE" };
  } catch (err) {
    return { success: false, message: "Network error sending to LINE" };
  }
}
