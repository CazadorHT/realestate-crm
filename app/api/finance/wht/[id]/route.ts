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
    const { data: commission, error: commErr } = await supabase
      .from("deal_commissions")
      .select(`
        *,
        agent:profiles!deal_commissions_agent_id_fkey (full_name),
        tenant:tenants (name),
        adjustments:commission_adjustments(*)
      `)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (commErr || !commission) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรายการคอมมิชชัน" }, { status: 404 });
    }

    // 2. Authorization Guard
    if (role !== "ADMIN" && commission.agent_id !== user.id) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้" }, { status: 403 });
    }

    // 3. Precision Calculation
    // มั่นใจว่า adjustments เป็น array เสมอ
    const adjustments = (commission as any).adjustments || [];
    const netPayout = FinanceMath.calculateNetPayout(
      commission.amount,
      commission.wht_amount,
      adjustments
    );

    // 4. Render to PDF Buffer
    // 🛡️ แก้ไขตัวแดง renderToBuffer โดยใช้ as any เพื่อข้ามข้อจำกัด Type ของ Library
    const pdfBuffer = await renderToBuffer(
      React.createElement(WhtCertificateTemplate, {
        data: {
          agentName: (commission as any).agent?.full_name || "ไม่ทราบชื่อ",
          address: "-", 
          taxAmount: FinanceMath.format(commission.wht_amount),
          grossAmount: FinanceMath.format(commission.amount),
          netAmount: FinanceMath.format(netPayout),
          date: format(new Date(), "d MMMM yyyy", { locale: th }),
          tenantName: (commission as any).tenant?.name || "Cazador CRM",
          referenceCode: commission.payment_reference || commission.id.slice(0, 8).toUpperCase(),
        }
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
  } catch (error: any) {
    console.error("WHT API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message }, 
      { status: 500 }
    );
  }
}