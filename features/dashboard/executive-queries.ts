import { createClient } from "@/lib/supabase/server";

export type ExecutiveStats = {
  totalRevenue: number;
  salesRevenue: number;
  rentalRevenue: number;
  totalCommission: number;
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

export async function getExecutiveStats(
  year?: number,
): Promise<ExecutiveStats> {
  const supabase = await createClient();
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1).toISOString();
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

  // 1. Fetch CLOSED_WIN deals for commission and deal counts
  const { data: deals, error: dealsError } = await supabase
    .from("deals")
    .select("deal_type, commission_amount, created_at")
    .eq("status", "CLOSED_WIN")
    .gte("created_at", startOfYear)
    .lte("created_at", endOfYear);

  if (dealsError) {
    console.error("[getExecutiveStats] Deals error:", dealsError);
  }

  // 2. Fetch SOLD/RENTED properties for revenue
  const { data: properties, error: propsError } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .is("deleted_at", null)
    .gte("updated_at", startOfYear)
    .lte("updated_at", endOfYear);

  if (propsError) {
    console.error("[getExecutiveStats] Properties error:", propsError);
  }

  const stats: ExecutiveStats = {
    totalRevenue: 0,
    salesRevenue: 0,
    rentalRevenue: 0,
    totalCommission: 0,
    totalDeals: (deals || []).length,
    salesCount: 0,
    rentalCount: 0,
  };

  deals?.forEach((d) => {
    stats.totalCommission += d.commission_amount || 0;
    if (d.deal_type === "SALE") stats.salesCount++;
    if (d.deal_type === "RENT") stats.rentalCount++;
  });

  properties?.forEach((p) => {
    const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
    stats.totalRevenue += val;
    if (p.status === "SOLD") stats.salesRevenue += p.price || 0;
    if (p.status === "RENTED") stats.rentalRevenue += p.rental_price || 0;
  });

  return stats;
}

export async function getMonthlyRevenueData(
  year?: number,
): Promise<MonthlyRevenue[]> {
  const supabase = await createClient();
  const currentYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .is("deleted_at", null)
    .gte("updated_at", new Date(currentYear, 0, 1).toISOString())
    .lte("updated_at", new Date(currentYear, 11, 31, 23, 59, 59).toISOString());

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

  data?.forEach((p) => {
    const date = new Date(p.updated_at);
    const monthIndex = date.getMonth();
    const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;

    if (p.status === "SOLD") monthlyData[monthIndex].sales += p.price || 0;
    if (p.status === "RENTED")
      monthlyData[monthIndex].rent += p.rental_price || 0;
    monthlyData[monthIndex].total += val;
  });

  return monthlyData;
}

export async function getQuarterlyRevenueData(
  year?: number,
): Promise<QuarterlyRevenue[]> {
  const monthlyData = await getMonthlyRevenueData(year);

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
