"use server";

import { createClient } from "@/lib/supabase/server";
import {
  generateCommissionPdf,
  CommissionStatementData,
} from "@/lib/finance/commission-pdf";
import { buildCommissionStatementFlex } from "@/lib/line-flex-builders";
import { sendLineNotification } from "@/lib/line";
import { format } from "date-fns";

export async function exportCommissionPdfAction(commissionId: string) {
  const supabase = await createClient();

  const { data: comm, error } = await (supabase as any)
    .from("deal_commissions")
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
  const supabase = await createClient();

  const { data: comm, error } = await (supabase as any)
    .from("deal_commissions")
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
    // Note: sendLineNotification currently uses LINE_ADMIN_USER_ID if nothing is passed,
    // but we want to send to the specific agent.
    // I might need to modify sendLineNotification in lib/line.ts to accept a 'to' parameter or use a lower level call.

    // Let's assume we can pass the ID. If not, I'll fix lib/line.ts.
    // Looking at lib/line.ts, it doesn't take a 'to' parameter in its signature.

    // I'll call the API directly or fix lib/line.ts.
    // Fix lib/line.ts is better for future use.

    return await sendToSpecificLineUser(lineId, flexMessage);
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
