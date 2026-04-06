"use server";

import { createClient } from "@/lib/supabase/server";
import { TopAgent, MarketingPerformanceData } from "./types";

export async function getTopAgents(tenantId?: string | null): Promise<TopAgent[]> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const { data: deals } = await applyTenantFilter(supabase
      .from("deals")
      .select("created_by, commission_amount")
      .eq("status", "CLOSED_WIN"));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url");

    if (!deals || !profiles) return [];

    const agentStats = new Map<
      string,
      {
        count: number;
        commission: number;
        profile: { full_name: string | null; avatar_url: string | null };
      }
    >();

    deals.forEach((d: any) => {
      if (!d.created_by) return;
      const current = agentStats.get(d.created_by) || {
        count: 0,
        commission: 0,
        profile: profiles.find((p) => p.id === d.created_by) || {
          full_name: "Unknown",
          avatar_url: null,
        },
      };

      agentStats.set(d.created_by, {
        count: current.count + 1,
        commission: current.commission + (d.commission_amount || 0),
        profile: current.profile,
      });
    });

    const result = Array.from(agentStats.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.profile.full_name || "Unknown Agent",
        avatar_url: stats.profile.avatar_url,
        deals_count: stats.count,
        total_commission: stats.commission,
      }))
      .sort((a, b) => b.total_commission - a.total_commission)
      .slice(0, 5);

    return result;
  } catch (error) {
    console.error("getTopAgents Error:", error);
    return [];
  }
}

export async function getAdvancedTopAgents(
  tenantId?: string | null,
): Promise<TopAgent[]> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();

    const { data: commissions, error } = await (applyTenantFilter(
      supabase.from("deal_commissions" as any).select(
        `
        net_amount,
        agent_id,
        agent:profiles (
          id,
          full_name,
          avatar_url
        )
      `,
      ),
    )
      .eq("status", "PAID")
      .neq("status", "CANCELLED")
      .gte("created_at", startOfMonth) as any);

    if (error || !commissions) {
      if (error) console.error("Error fetching advanced top agents:", error);
      return [];
    }

    const agentMap = new Map<
      string,
      {
        count: number;
        amount: number;
        profile: { full_name: string | null; avatar_url: string | null };
      }
    >();

    commissions.forEach((c: any) => {
      if (!c.agent_id || !c.agent) return;
      const current = agentMap.get(c.agent_id) || {
        count: 0,
        amount: 0,
        profile: {
          full_name: c.agent.full_name,
          avatar_url: c.agent.avatar_url,
        },
      };

      agentMap.set(c.agent_id, {
        count: current.count + 1,
        amount: current.amount + (Number(c.net_amount) || 0),
        profile: current.profile,
      });
    });

    return Array.from(agentMap.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.profile.full_name || "Unknown",
        avatar_url: stats.profile.avatar_url,
        deals_count: stats.count,
        total_commission: stats.amount,
      }))
      .sort((a, b) => b.total_commission - a.total_commission)
      .slice(0, 5);
  } catch (err) {
    console.error("getAdvancedTopAgents Error:", err);
    return [];
  }
}

export async function getMarketingPerformanceData(tenantId?: string | null): Promise<
  MarketingPerformanceData[]
> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("leads")
      .select("utm_source, ai_score")
      .is("deleted_at", null);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: leads } = await query;


    if (!leads) return [];

    const statsMap = new Map<
      string,
      { count: number; totalScore: number; hotLeads: number }
    >();

    leads.forEach((l: any) => {
      const source = l.utm_source || "Direct / Unknown";
      const score = l.ai_score || 0;
      const isHot = score >= 80;

      const current = statsMap.get(source) || {
        count: 0,
        totalScore: 0,
        hotLeads: 0,
      };
      statsMap.set(source, {
        count: current.count + 1,
        totalScore: current.totalScore + score,
        hotLeads: current.hotLeads + (isHot ? 1 : 0),
      });
    });

    return Array.from(statsMap.entries())
      .map(([source, stats]) => ({
        source,
        leadCount: stats.count,
        avgAiScore: Math.round(stats.totalScore / stats.count),
        hotLeadCount: stats.hotLeads,
      }))
      .sort((a, b) => b.leadCount - a.leadCount);
  } catch (error) {
    console.error("getMarketingPerformanceData Error:", error);
    return [];
  }
}

export async function getExecutiveWeeklyAISummaryAction(tenantId?: string | null) {
  try {
    const supabase = await createClient();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString();

    const applyTenantFilter = (q: any) => {
      if (tenantId && tenantId !== "ALL") {
        return q.eq("tenant_id", tenantId);
      }
      return q;
    };

    // 1. Fetch Stats
    const [leadsRes, dealsRes, propertiesRes] = await Promise.all([
      applyTenantFilter(supabase
        .from("leads")
        .select("utm_source, ai_score, created_at")
        .gte("created_at", monthAgoStr)
        .is("deleted_at", null)),
      applyTenantFilter(supabase
        .from("deals")
        .select("status, deal_type, commission_amount, created_at")
        .gte("created_at", monthAgoStr)
        .is("deleted_at", null)),
      applyTenantFilter(supabase
        .from("properties")
        .select("view_count, property_type")
        .is("deleted_at", null)),
    ]);


    const leads = leadsRes.data || [];
    const deals = dealsRes.data || [];
    const props = propertiesRes.data || [];

    const totalLeads = leads.length;
    const hotLeads = leads.filter((l: any) => (l.ai_score || 0) >= 80).length;
    const dealsWon = deals.filter(
      (d: any) => d.status === "CLOSED_WIN" || d.status === "SIGNED",
    ).length;

    // Aggregate UTMs
    const utmMap = new Map();
    leads.forEach((l: any) => {
      const s = l.utm_source || "Direct";
      utmMap.set(s, (utmMap.get(s) || 0) + 1);
    });
    const topSource =
      Array.from(utmMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // If no data, return a mock sample
    if (totalLeads === 0 && deals.length === 0) {
      return {
        summary: "📊 [ข้อมูลตัวอย่างจำลอง - เนื่องจากคุณยังไม่มีข้อมูลจริงในระบบ]\n\nในรอบ 30 วันที่ผ่านมา ภาพรวมธุรกิจมีทิศทางที่เติบโตอย่างน่าสนใจ โดยเราได้ Lead ใหม่เข้ามาถึง 45 ราย ซึ่งในจำนวนนี้เป็น Hot Lead ที่ระบบประเมินว่ามีโอกาสปิดการขายสูงถึง 12 ราย\n\nในฝั่งของทีมขาย สามารถปิดดีลได้สำเร็จแล้ว 5 ดีล ซึ่งเป็นสัญญาณบวกของเดือนนี้\n\n💡 คำแนะนำเชิงกลยุทธ์จาก AI:\n- แพลตฟอร์ม Facebook ใช้งานได้ผลดีเยี่ยม นำลีดเข้ามาได้มากที่สุด ควรพิจารณาเพิ่มงบโฆษณาในส่วนนี้\n- ทีมเซลส์ควรให้ความสำคัญและเร่งเจรจากับกลุ่ม Hot Lead ทั้ง 12 ราย เพื่อเพิ่มยอดปิดการขายก่อนสิ้นเดือน",
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
    const prompt = `
    คุณเป็นผู้ช่วยวิเคราะห์ธุรกิจอสังหาริมทรัพย์ระดับสูง
    สรุปผลการดำเนินงานในรอบ 30 วันที่ผ่านมาให้ผู้บริหารฟัง จากข้อมูลดังนี้:
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

    const result = await generateText(prompt, "gemini-2.0-flash");

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
