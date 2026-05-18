import { NextRequest, NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/authz";
import { renderToBuffer } from "@react-pdf/renderer";
import { WhtCertificateTemplate } from "@/features/finance/components/WhtCertificateTemplate";
import { FinanceMath } from "@/lib/finance/precision";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import React from 'react';

// ✅ กำหนด Interface สำหรับ Payload ให้ชัดเจนกันบัค Type
interface WhtData {
  agentName: string;
  address: string;
  taxAmount: string;
  grossAmount: string;
  netAmount: string;
  date: string;
  tenantName: string;
  referenceCode: string;
}

export async function GET(
  req: NextRequest,
  // 🛡️ Next.js 14+ params is a Promise
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    const { id } = await params; // ✅ Await params

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    // 1. Fetch Commission Record + adjustments
    // 🛡️ ใส่ Type Casting ให้ Supabase Query เพื่อลดตัวแดงใน Property
    const { data: rawCommission, error: commErr } = await supabase
      .from("crm_deal_commissions_v3")
      .select("*, recipient:identities_v3!crm_deal_commissions_v3_recipient_id_fkey(display_name, metadata), tenant:tenants_v3(name)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (commErr || !rawCommission) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรายการคอมมิชชัน" }, { status: 404 });
    }

    const commission = rawCommission as any;

    // Fetch adjustments explicitly from financial_ledger_v3
    const { data: adjustmentsData } = await supabase
      .from("financial_ledger_v3")
      .select("*")
      .eq("reference_entity", "COMMISSION")
      .eq("reference_id", id);
    const adjustments = (adjustmentsData || []).map((a: any) => ({ amount: a.amount_net || a.amount || 0 }));

    // 2. Authorization Guard
    if (role !== "ADMIN" && commission.recipient_id !== user.id) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้" }, { status: 403 });
    }

    // 3. Precision Calculation
    const netPayout = FinanceMath.calculateNetPayout(
      commission.amount || 0,
      commission.tax_amount || 0,
      adjustments
    );

    // 4. Render to PDF Buffer
    // Define exact structure for the template to avoid 'any'
    const recipientMeta = commission.recipient?.metadata || {};
    const templateData = {
      agentName: commission.recipient?.display_name || "ไม่ทราบชื่อ",
      address: recipientMeta?.tax_address || recipientMeta?.address || "-", 
      taxAmount: FinanceMath.format(commission.tax_amount || 0),
      grossAmount: FinanceMath.format(commission.amount || 0),
      netAmount: FinanceMath.format(netPayout),
      date: format(new Date(), "d MMMM yyyy", { locale: th }),
      tenantName: commission.tenant?.name || "Cazador CRM",
      referenceCode: commission.metadata?.payment_reference || commission.id.slice(0, 8).toUpperCase(),
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(WhtCertificateTemplate, {
        data: templateData
      }) as any
    );

    // 5. Response Headers
    const fileName = `WHT_${commission.id.slice(0, 8)}.pdf`;
    
    // ✅ แปลง Buffer เป็น Uint8Array เพื่อความชัวร์ใน Next.js Response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        // 🛡️ ป้องกัน Browser จำแคชเอกสารที่อาจมีการแก้ไข
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("WHT API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message }, 
      { status: 500 }
    );
  }
}