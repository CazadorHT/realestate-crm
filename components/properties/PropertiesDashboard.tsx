"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Home,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Coins,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { PropertyStats } from "@/features/properties/queries";
import { useRouter } from "next/navigation";

// --- Configuration Maps ---

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  CONDO: { label: "คอนโด", color: "#3b82f6" }, // Blue
  HOUSE: { label: "บ้านเดี่ยว", color: "#10b981" }, // Green
  TOWNHOUSE: { label: "ทาวน์เฮ้าส์", color: "#f59e0b" }, // Amber
  LAND: { label: "ที่ดิน", color: "#8b5cf6" }, // Purple
  COMMERCIAL: { label: "อาคารพาณิชย์", color: "#06b6d4" }, // Cyan
  HOTEL: { label: "โรงแรม", color: "#ec4899" }, // Pink
  APARTMENT: { label: "อพาร์ทเมนท์", color: "#f97316" }, // Orange
  WAREHOUSE: { label: "โกดัง", color: "#6366f1" }, // Indigo
  FACTORY: { label: "โรงงาน", color: "#475569" }, // Slate
  Unknown: { label: "ไม่ระบุ", color: "#cbd5e1" }, // Gray
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "ว่าง (Active)", color: "#10b981" }, // Green
  AVAILABLE: { label: "ว่าง (Active)", color: "#10b981" }, // Green (Fallback)
  SOLD: { label: "ขายแล้ว (Sold)", color: "#ef4444" }, // Red
  RENTED: { label: "เช่าแล้ว (Rented)", color: "#3b82f6" }, // Blue
  RESERVED: { label: "จองแล้ว (Reserved)", color: "#f59e0b" }, // Amber
  Biocked: { label: "ระงับชั่วคราว", color: "#6b7280" },
  DRAFT: { label: "ร่าง (Draft)", color: "#fcd34d" }, // Yellow
  CLOSED: { label: "ปิดการขาย", color: "#64748b" }, // Slate
  Unknown: { label: "ไม่ระบุ", color: "#cbd5e1" },
};

// Fallback color palette
const DEFAULT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#64748b",
];

interface PropertiesDashboardProps {
  stats: PropertyStats;
}

export function PropertiesDashboard({ stats }: PropertiesDashboardProps) {
  const router = useRouter();

  // Helper to get config safely
  const getTypeConfig = (key: string) =>
    TYPE_CONFIG[key] || {
      label: key,
      color: DEFAULT_COLORS[key.length % DEFAULT_COLORS.length],
    };

  const getStatusConfig = (key: string) =>
    STATUS_CONFIG[key] || {
      label: key,
      color: DEFAULT_COLORS[key.length % DEFAULT_COLORS.length],
    };

  // Transform data for charts
  const typeData = stats.byType
    .map((item) => {
      const config = getTypeConfig(item.name);
      return {
        id: item.name, // keep original key for filtering
        name: config.label,
        value: item.value,
        color: config.color,
      };
    })
    .sort((a, b) => b.value - a.value); // Sort descending

  const statusData = stats.byStatus
    .map((item) => {
      const config = getStatusConfig(item.name);
      return {
        id: item.name === "AVAILABLE" ? "ACTIVE" : item.name, // Normalize
        name: config.label,
        value: item.value,
        color: config.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Interaction Handlers
  const handleTypeClick = (data: any) => {
    // Recharts onClick payload can be complex, usually contains the payload data
    if (data && data.id) {
      router.push(`/protected/properties?type=${data.id}`);
    } else if (data && data.payload && data.payload.id) {
      router.push(`/protected/properties?type=${data.payload.id}`);
    }
  };

  const handleStatusClick = (data: any) => {
    if (data && data.id) {
      router.push(`/protected/properties?status=${data.id}`);
    } else if (data && data.activePayload && data.activePayload[0]) {
      // Bar chart might pass different structure
      const id = data.activePayload[0].payload.id;
      if (id) router.push(`/protected/properties?status=${id}`);
    }
  };

  // Custom Label for Pie Chart, strictly typed props would require a complex interface,
  // keeping it simple but safe is key.
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold pointer-events-none"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ทรัพย์ทั้งหมด
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">รายการในระบบ</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ประกาศ Active
            </CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Home className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.available}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              กำลังประกาศขาย/เช่า
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              คอมมิชชั่นปิดได้
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat("th-TH", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(stats.totalRealizedCommission || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              บาท (จาก Sold & Rented)
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              คอมมิชชั่นคาดการณ์
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Coins className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-1">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    ขาย (Sale)
                  </p>
                  <div className="text-xl font-bold text-amber-600">
                    {new Intl.NumberFormat("th-TH", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(stats.totalSaleCommission || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    เช่า (Rent)
                  </p>
                  <div className="text-xl font-bold text-blue-600">
                    {new Intl.NumberFormat("th-TH", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(stats.totalRentCommission || 0)}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center bg-slate-50 py-1 rounded">
              จากทรัพย์ Active ทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution - Pie Chart */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-linear-to-br from-white to-slate-50">
          <CardHeader className="pb-2 border-b border-slate-100/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  สัดส่วนประเภททรัพย์
                </CardTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  คลิกที่กราฟเพื่อกรองตามประเภท
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-xl">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="99%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <PieChart>
                  <defs>
                    {typeData.map((entry, index) => (
                      <linearGradient
                        key={`gradient-${index}`}
                        id={`colorGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.color}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={entry.color}
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                    onClick={handleTypeClick}
                    className="cursor-pointer outline-none drop-shadow-md"
                    stroke="none"
                  >
                    {typeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#colorGradient-${index})`}
                        className="hover:opacity-90 transition-all duration-200 hover:drop-shadow-lg"
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      <span key="val" className="font-bold">
                        {value} รายการ
                      </span>,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      padding: "12px 16px",
                      background: "white",
                    }}
                    itemStyle={{ color: "#334155", fontWeight: 500 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-sm text-slate-600 font-medium ml-1">
                        {value}
                      </span>
                    )}
                    wrapperStyle={{ paddingTop: "16px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution - Bar Chart */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-linear-to-br from-white to-slate-50">
          <CardHeader className="pb-2 border-b border-slate-100/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  สถานะทรัพย์สิน
                </CardTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  คลิกที่แท่งกราฟเพื่อกรองตามสถานะ
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer
                width="99%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ left: 10, right: 24, top: 8, bottom: 8 }}
                  onClick={handleStatusClick}
                  className="cursor-pointer"
                >
                  <defs>
                    {statusData.map((entry, index) => (
                      <linearGradient
                        key={`bar-gradient-${index}`}
                        id={`barGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.color}
                          stopOpacity={0.85}
                        />
                        <stop
                          offset="100%"
                          stopColor={entry.color}
                          stopOpacity={1}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#475569", fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59, 130, 246, 0.05)", radius: 8 }}
                    formatter={(value: any) => [
                      <span key="val" className="font-bold">
                        {value} รายการ
                      </span>,
                      "จำนวน",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      padding: "12px 16px",
                      background: "white",
                    }}
                    itemStyle={{ color: "#334155", fontWeight: 500 }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    barSize={28}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-status-${index}`}
                        fill={`url(#barGradient-${index})`}
                        className="hover:brightness-110 transition-all duration-200"
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
