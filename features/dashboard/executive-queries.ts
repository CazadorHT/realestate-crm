import { createClient } from "@/lib/supabase/server";

export type ExecutiveStats = {
  totalRevenue: number;
  salesRevenue: number;
  rentalRevenue: number;
  totalCommission: number;
  salesCommission: number;
  rentalCommission: number;
  totalDeals: number;
  salesCount: number;
  rentalCount: number;
};

export type MonthlyRevenue = {
  month: string;
  sales: number;
  rent: number;
  total: number;
};

export type QuarterlyRevenue = {
  quarter: string;
  sales: number;
  rent: number;
  total: number;
};

export type PipelineStats = {
  totalOpenDeals: number;
  expectedValue: number;
  stageBreakdown: Record<string, number>;
};

export type SetupProgress = {
  profileCompleted: boolean;
  firstAgentAdded: boolean;
  firstPropertyAdded: boolean;
  lineConnected: boolean;
  isAllCompleted: boolean;
  completedCount: number;
  totalSteps: number;
};

interface DealQueryResult {
  status: string;
  deal_type: string;
  commission_amount?: number | null;
  created_at?: string;
  property?: {
    price: number | null;
    rental_price: number | null;
  }
}

interface PropertyQueryResult {
  price: number | null;
  rental_price: number | null;
  status: string;
  updated_at: string;
}

export async function getExecutiveStats(
  tenantId?: string | null,
  year?: number,
  range: string = "year",
): Promise<ExecutiveStats> {
  try {
    const supabase = await createClient();
    const currentYear = year || new Date().getFullYear();
    
    let startDate: string;
    let endDate: string;

    if (range === "year") {
      startDate = new Date(currentYear, 0, 1).toISOString();
      endDate = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();
    } else {
      // Calculate based on standard ranges
      const now = new Date();
      const start = new Date();
      if (range === "today") start.setHours(0, 0, 0, 0);
      else if (range === "week") start.setDate(now.getDate() - 7);
      else if (range === "month") start.setMonth(now.getMonth(), 1);
      else if (range === "6months") start.setMonth(now.getMonth() - 6);
      else start.setFullYear(currentYear, 0, 1); // fallback to year
      
      startDate = start.toISOString();
      endDate = now.toISOString();
    }

    const applyTenantFilter = <T extends { eq: (col: string, val: string) => T }>(query: T): T => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    // 1. Fetch CLOSED_WIN deals for commission and deal counts
    const { data: deals, error: dealsError } = await applyTenantFilter(
      supabase
        .from("deals")
        .select("status, deal_type, commission_amount, created_at")
        .eq("status", "CLOSED_WIN")
        .gte("created_at", startDate)
        .lte("created_at", endDate),
    );

  if (dealsError) {
    console.error("[getExecutiveStats] Deals error:", dealsError);
  }

  // 2. Fetch SOLD/RENTED properties for revenue
  const { data: properties, error: propsError } = await applyTenantFilter(
    supabase
      .from("properties")
      .select("price, rental_price, status, updated_at")
      .in("status", ["SOLD", "RENTED"])
      .is("deleted_at", null)
      .gte("updated_at", startDate)
      .lte("updated_at", endDate),
  );

  if (propsError) {
    console.error("[getExecutiveStats] Properties error:", propsError);
  }

  const stats: ExecutiveStats = {
    totalRevenue: 0,
    salesRevenue: 0,
    rentalRevenue: 0,
    totalCommission: 0,
    salesCommission: 0,
    rentalCommission: 0,
    totalDeals: (deals || []).length,
    salesCount: 0,
    rentalCount: 0,
  };

  deals?.forEach((d: DealQueryResult) => {
    const comm = d.commission_amount || 0;
    stats.totalCommission += comm;
    if (d.deal_type === "SALE") {
      stats.salesCount++;
      stats.salesCommission += comm;
    }
    if (d.deal_type === "RENT") {
      stats.rentalCount++;
      stats.rentalCommission += comm;
    }
  });

    properties?.forEach((p: PropertyQueryResult) => {
      const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
      stats.totalRevenue += val;
      if (p.status === "SOLD") stats.salesRevenue += p.price || 0;
      if (p.status === "RENTED") stats.rentalRevenue += p.rental_price || 0;
    });

    return stats;
  } catch (error) {
    console.error("getExecutiveStats Error:", error);
    return {
      totalRevenue: 0,
      salesRevenue: 0,
      rentalRevenue: 0,
      totalCommission: 0,
      salesCommission: 0,
      rentalCommission: 0,
      totalDeals: 0,
      salesCount: 0,
      rentalCount: 0,
    };
  }
}

export async function getMonthlyRevenueData(
  tenantId?: string | null,
  year?: number,
  range: string = "year",
): Promise<MonthlyRevenue[]> {
  try {
    const supabase = await createClient();
    const currentYear = year || new Date().getFullYear();

    const applyTenantFilter = <T extends { eq: (col: string, val: string) => T }>(query: T): T => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const { data, error } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("price, rental_price, status, updated_at")
        .in("status", ["SOLD", "RENTED"])
        .is("deleted_at", null)
        .gte("updated_at", new Date(currentYear, 0, 1).toISOString())
        .lte(
          "updated_at",
          new Date(currentYear, 11, 31, 23, 59, 59).toISOString(),
        ),
    );

    if (error) {
      console.error("[getMonthlyRevenueData] Error:", error);
      return [];
    }

  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  const monthlyData: MonthlyRevenue[] = months.map((m) => ({
    month: m,
    sales: 0,
    rent: 0,
    total: 0,
  }));

  data?.forEach((p: PropertyQueryResult) => {
    const date = new Date(p.updated_at);
    const monthIndex = date.getMonth();
    const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;

    if (p.status === "SOLD") monthlyData[monthIndex].sales += p.price || 0;
    if (p.status === "RENTED")
      monthlyData[monthIndex].rent += p.rental_price || 0;
    monthlyData[monthIndex].total += val;
  });

    return monthlyData;
  } catch (error) {
    console.error("getMonthlyRevenueData Error:", error);
    return [];
  }
}

export async function getQuarterlyRevenueData(
  tenantId?: string | null,
  year?: number,
  range: string = "year",
): Promise<QuarterlyRevenue[]> {
  const monthlyData = await getMonthlyRevenueData(tenantId, year, range);

  const quarterlyData: QuarterlyRevenue[] = [
    { quarter: "Q1 (ม.ค.-มี.ค.)", sales: 0, rent: 0, total: 0 },
    { quarter: "Q2 (เม.ย.-มิ.ย.)", sales: 0, rent: 0, total: 0 },
    { quarter: "Q3 (ก.ค.-ก.ย.)", sales: 0, rent: 0, total: 0 },
    { quarter: "Q4 (ต.ค.-ธ.ค.)", sales: 0, rent: 0, total: 0 },
  ];

  monthlyData.forEach((m, i) => {
    const qIndex = Math.floor(i / 3);
    quarterlyData[qIndex].sales += m.sales;
    quarterlyData[qIndex].rent += m.rent;
    quarterlyData[qIndex].total += m.total;
  });

  return quarterlyData;
}

export async function getPipelineStats(
  tenantId?: string | null,
): Promise<PipelineStats> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = <T extends { eq: (col: string, val: string) => T }>(query: T): T => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    // Fetch deals that are not closed, with their property price/rental_price
    const { data: deals, error } = await applyTenantFilter(
      supabase
        .from("deals")
        .select(
          `
        status, 
        deal_type,
        property:properties(price, rental_price)
      `,
        )
        .not("status", "in", '("CLOSED_WIN","CLOSED_LOSS")'),
    );

    if (error) {
      console.error("[getPipelineStats] Error:", error);
      return { totalOpenDeals: 0, expectedValue: 0, stageBreakdown: {} };
    }
    const stats: PipelineStats = {
      totalOpenDeals: (deals || []).length,
      expectedValue: 0,
      stageBreakdown: {},
    };

    deals?.forEach((d: DealQueryResult) => {
      const propertyPrice =
        d.deal_type === "SALE"
          ? d.property?.price || 0
          : d.property?.rental_price || 0;

      stats.expectedValue += propertyPrice;
      stats.stageBreakdown[d.status] = (stats.stageBreakdown[d.status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("getPipelineStats Error:", error);
    return { totalOpenDeals: 0, expectedValue: 0, stageBreakdown: {} };
  }
}

export async function getSetupProgress(
  tenantId: string,
): Promise<SetupProgress> {
  try {
    const supabase = await createClient();

    if (!tenantId || tenantId === "ALL") {
      return {
        profileCompleted: true,
        firstAgentAdded: true,
        firstPropertyAdded: true,
        lineConnected: true,
        isAllCompleted: true,
        completedCount: 4,
        totalSteps: 4,
      };
    }

    // 1. Check Profile (Tenant info)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("logo_url, name")
      .eq("id", tenantId)
      .single();

    // 2. Check Employees
    const { count: memberCount } = await supabase
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    // 3. Check Properties
    const { count: propertyCount } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    // 4. Check LINE connection (either groups or any member has line_id)
    const { count: lineCount } = await supabase
      .from("line_groups")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const { count: lineMemberCount } = await supabase
      .from("tenant_members")
      .select("id, profiles!inner(line_user_id, line_id)", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .or("line_user_id.not.is.null,line_id.not.is.null", { foreignTable: "profiles" });

    // 5. Check Invitations (counts as progress for adding staff)
    const { count: invitationCount } = await supabase
      .from("tenant_invitations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "PENDING");

    const profileCompleted = !!tenant?.name;
    const firstAgentAdded = (memberCount || 0) > 1 || (invitationCount || 0) > 0;
    const firstPropertyAdded = (propertyCount || 0) > 0;
    const lineConnected = (lineCount || 0) > 0 || (lineMemberCount || 0) > 0;

    const completedCount = [
      profileCompleted,
      firstAgentAdded,
      firstPropertyAdded,
      lineConnected,
    ].filter(Boolean).length;

    return {
      profileCompleted,
      firstAgentAdded,
      firstPropertyAdded,
      lineConnected,
      completedCount,
      totalSteps: 4,
      isAllCompleted: completedCount === 4,
    };
  } catch (error) {
    console.error("getSetupProgress Error:", error);
    return {
      profileCompleted: false,
      firstAgentAdded: false,
      firstPropertyAdded: false,
      lineConnected: false,
      isAllCompleted: false,
      completedCount: 0,
      totalSteps: 4,
    };
  }
}
