import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  const supabase = await createClient();
  const now = new Date();

  // Handle quick filters
  if (year === "month") {
    // This month
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data } = await supabase
      .from("properties")
      .select("price, rental_price, status, updated_at")
      .in("status", ["SOLD", "RENTED"])
      .gte("updated_at", startDate.toISOString())
      .lte("updated_at", endDate.toISOString());

    // Group by day
    const grouped = new Map<string, number>();
    const daysInMonth = endDate.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      grouped.set(`${day}`, 0);
    }

    data?.forEach((p) => {
      const date = new Date(p.updated_at);
      const dayKey = date.getDate().toString();
      const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
      grouped.set(dayKey, (grouped.get(dayKey) || 0) + val);
    });

    const result = Array.from(grouped.entries()).map(([name, total]) => ({
      name,
      total,
    }));

    return NextResponse.json({ data: result });
  }

  if (year === "6months") {
    // Last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data } = await supabase
      .from("properties")
      .select("price, rental_price, status, updated_at")
      .in("status", ["SOLD", "RENTED"])
      .gte("updated_at", sixMonthsAgo.toISOString());

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
    const grouped = new Map<string, number>();

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = months[d.getMonth()];
      grouped.set(key, 0);
    }

    data?.forEach((p) => {
      const date = new Date(p.updated_at);
      const monthKey = months[date.getMonth()];
      const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
      if (grouped.has(monthKey)) {
        grouped.set(monthKey, (grouped.get(monthKey) || 0) + val);
      }
    });

    const result = Array.from(grouped.entries()).map(([name, total]) => ({
      name,
      total,
    }));

    return NextResponse.json({ data: result });
  }

  if (year === "year") {
    // This year (current year)
    const currentYear = now.getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);
    const endDate = new Date(`${currentYear}-12-31`);

    const { data } = await supabase
      .from("properties")
      .select("price, rental_price, status, updated_at")
      .in("status", ["SOLD", "RENTED"])
      .gte("updated_at", startDate.toISOString())
      .lte("updated_at", endDate.toISOString());

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
    const grouped = new Map<string, number>();
    months.forEach((month) => grouped.set(month, 0));

    data?.forEach((p) => {
      const date = new Date(p.updated_at);
      const monthIndex = date.getMonth();
      const monthKey = months[monthIndex];
      const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
      grouped.set(monthKey, (grouped.get(monthKey) || 0) + val);
    });

    const result = Array.from(grouped.entries()).map(([name, total]) => ({
      name,
      total,
    }));

    return NextResponse.json({ data: result });
  }

  if (year === "all") {
    // Get all data grouped by year
    const { data } = await supabase
      .from("properties")
      .select("price, rental_price, status, updated_at")
      .in("status", ["SOLD", "RENTED"]);

    // Group by Year
    const grouped = new Map<string, number>();

    data?.forEach((p) => {
      const date = new Date(p.updated_at);
      const yearKey = date.getFullYear().toString();
      const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
      grouped.set(yearKey, (grouped.get(yearKey) || 0) + val);
    });

    const result = Array.from(grouped.entries())
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([name, total]) => ({
        name,
        total,
      }));

    return NextResponse.json({ data: result });
  }

  // Get data for specific year (12 months)
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const { data } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .gte("updated_at", startDate.toISOString())
    .lte("updated_at", endDate.toISOString());

  // Group by Month
  const grouped = new Map<string, number>();

  // Initialize all 12 months
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

  months.forEach((month) => grouped.set(month, 0));

  data?.forEach((p) => {
    const date = new Date(p.updated_at);
    const monthIndex = date.getMonth();
    const monthKey = months[monthIndex];
    const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
    grouped.set(monthKey, (grouped.get(monthKey) || 0) + val);
  });

  const result = Array.from(grouped.entries()).map(([name, total]) => ({
    name,
    total,
  }));

  return NextResponse.json({ data: result });
}
