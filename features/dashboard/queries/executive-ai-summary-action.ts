"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types.generated";

type LeadRow = Database["public"]["Tables"]["crm_leads_v3"]["Row"];
type LedgerRow = Database["public"]["Tables"]["financial_ledger_v3"]["Row"];

export interface AISummaryResult {
  summary: string;
  stats: {
    totalLeads: number;
    hotLeads: number;
    dealsWon: number;
    topSource: string;
  };
  isSample?: boolean;
}

export async function getExecutiveWeeklyAISummaryAction({
  tenantId,
  filters
}: {
  tenantId?: string | null;
  filters?: {
    branchId?: string | null;
    teamId?: string | null;
    agentId?: string | null;
  };
}): Promise<AISummaryResult> {
  try {
    const supabase = await createClient();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString();

    const applyFilters = <T extends { eq: (col: string, val: string) => T; url: URL }>(q: T) => {
      // 1. Branch Filter (Tenant)
      const activeTenantId = filters?.branchId || tenantId;
      if (activeTenantId && activeTenantId !== "ALL") {
        q = q.eq("tenant_id", activeTenantId);
      }

      // 2. Agent Filter
      if (filters?.agentId && filters.agentId !== "ALL") {
        if (q.url.pathname.includes("leads")) {
          q = q.eq("assigned_to", filters.agentId);
        } else if (q.url.pathname.includes("financial_ledger")) {
          q = q.eq("to_identity_id", filters.agentId);
        }
      }

      return q;
    };

    // Special handling for Team Filter if present
    let teamMemberIds: string[] = [];
    if (filters?.teamId && filters.teamId !== "ALL") {
      const { data: members } = await supabase
        .from("tenant_members_v3")
        .select("identity_id")
        .eq("team_id", filters.teamId);
      teamMemberIds = (members || []).map((m: { identity_id: string }) => m.identity_id);
    }

    const applyTeamFilter = <T extends { in: (col: string, vals: string[]) => T; url: URL }>(q: T) => {
      if (teamMemberIds.length > 0) {
        if (q.url.pathname.includes("leads")) {
          return q.in("assigned_to", teamMemberIds);
        } else if (q.url.pathname.includes("financial_ledger")) {
          return q.in("to_identity_id", teamMemberIds);
        }
      }
      return q;
    };

    // 1. Fetch Stats (Optimized: Removed unused properties query)
    const [leadsRes, dealsRes] = await Promise.all([
      applyTeamFilter(
        applyFilters(
          supabase
            .from("crm_leads_v3")
            .select("source, ai_score, created_at")
            .gte("created_at", monthAgoStr),
        ),
      ),
      applyTeamFilter(
        applyFilters(
          supabase
            .from("financial_ledger_v3")
            .select("status, transaction_type, amount_total, created_at")
            .gte("created_at", monthAgoStr),
        ),
      ),
    ]);

    const leads = (leadsRes.data || []) as Partial<LeadRow>[];
    const deals = (dealsRes.data || []) as Partial<LedgerRow>[];

    const totalLeads = leads.length;
    const hotLeads = leads.filter((l) => (l.ai_score || 0) >= 80).length;
    const dealsWon = deals.filter(
      (d) => d.transaction_type === "deal_closed",
    ).length;

    // Aggregate UTMs
    const utmMap = new Map<string, number>();
    leads.forEach((l) => {
      const s = l.source || "Direct";
      utmMap.set(s, (utmMap.get(s) || 0) + 1);
    });
    const topSource =
      Array.from(utmMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // If no data, return a mock sample
    if (totalLeads === 0 && deals.length === 0) {
      return {
        summary:
          "📊 [ข้อมูลตัวอย่างจำลอง - เนื่องจากคุณยังไม่มีข้อมูลจริงในระบบ]\n\nในรอบ 30 วันที่ผ่านมา ภาพรวมธุรกิจมีทิศทางที่เติบโตอย่างน่าสนใจ โดยเราได้ Lead ใหม่เข้ามาถึง 45 ราย ซึ่งในจำนวนนี้เป็น Hot Lead ที่ระบบประเมินว่ามีโอกาสปิดการขายสูงถึง 12 ราย\n\nในฝั่งของทีมขาย สามารถปิดดีลได้สำเร็จแล้ว 5 ดีล ซึ่งเป็นสัญญาณบวกของเดือนนี้\n\n💡 คำแนะนำเชิงกลยุทธ์จาก AI:\n- แพลตฟอร์ม Facebook ใช้งานได้ผลดีเยี่ยม นำลีดเข้ามาได้มากที่สุด ควรพิจารณาเพิ่มงบโฆษณาในส่วนนี้\n- ทีมเซลส์ควรให้ความสำคัญและเร่งเจรจากับกลุ่ม Hot Lead ทั้ง 12 ราย เพื่อเพิ่มยอดปิดการขายก่อนสิ้นเดือน",
        stats: {
          totalLeads: 45,
          hotLeads: 12,
          dealsWon: 5,
          topSource: "Facebook",
        },
        isSample: true,
      };
    }

    // 2. AI Generate Summary
    const { generateText } = await import("@/lib/ai/gemini");

    let scopeText = "ภาพรวมบริษัท";
    if (filters?.agentId && filters.agentId !== "ALL") scopeText = "ผลงานส่วนตัว";
    else if (filters?.teamId && filters.teamId !== "ALL") scopeText = "ผลงานทีม";
    else if (filters?.branchId && filters.branchId !== "ALL")
      scopeText = "ผลงานสาขา";

    const prompt = `
    คุณเป็นผู้ช่วยวิเคราะห์ธุรกิจอสังหาริมทรัพย์ระดับสูง
    สรุปผลการดำเนินงาน (${scopeText}) ในรอบ 30 วันที่ผ่านมาให้ฟัง จากข้อมูลดังนี้:
    - จำนวน Lead ใหม่: ${totalLeads} คน
    - จำนวน Hot Lead (คุณภาพสูง): ${hotLeads} คน
    - ดีลที่ปิดการขายได้สำเร็จ: ${dealsWon} ดีล
    - ช่องทางที่ได้ Lead มากที่สุด: ${topSource}
    
    คำแนะนำ:
    1. วิเคราะห์แนวโน้มสั้นๆ ว่าดีหรือควรปรับปรุงตรงไหน
    2. ให้คำแนะนำเชิงกลยุทธ์ 2-3 ข้อ (เช่น เพิ่มงบช่องทาง X หรือ เน้นติดตาม Hot Lead)
    3. ใช้ภาษาไทยที่เป็นทางการแต่กระชับ น่าเชื่อถือ
    4. ไม่ต้องใส่หัวข้อใหญ่ เอาเฉพาะเนื้อหาที่สรุปมาเลย
  `;

    const result = await generateText(prompt, "gemini-flash-lite-latest");

    return {
      summary: result.text || "ไม่สามารถสรุปข้อมูลได้ในขณะนี้",
      stats: {
        totalLeads,
        hotLeads,
        dealsWon,
        topSource,
      },
    };
  } catch (error) {
    console.error("getExecutiveWeeklyAISummaryAction Error:", error);
    return {
      summary: "ไม่สามารถประมวลผลข้อมูลได้ในขณะนี้",
      stats: {
        totalLeads: 0,
        hotLeads: 0,
        dealsWon: 0,
        topSource: "N/A",
      },
    };
  }
}
