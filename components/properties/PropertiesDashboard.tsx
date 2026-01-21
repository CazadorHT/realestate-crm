"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Home,
  CheckCircle2,
  TrendingUp,
  DollarSign,
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
    if (data && data.id) {
      router.push(`/protected/properties?type=${data.id}`);
    }
  };

  const handleStatusClick = (data: any) => {
    if (data && data.id) {
      router.push(`/protected/properties?status=${data.id}`);
    }
  };

  // Custom Label for Pie Chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
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
              ปิดการขายแล้ว
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.soldOrRented}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sold & Rented</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              มูลค่าพอร์ต (ว่าง)
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {new Intl.NumberFormat("th-TH", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              บาท (เฉพาะรายการ Active)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สัดส่วนประเภททรัพย์</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                    onClick={handleTypeClick}
                    className="cursor-pointer outline-none"
                  >
                    {typeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "จำนวน"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สถานะทรัพย์สิน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                  onClick={handleStatusClick}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    fontSize={12}
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                    animationDuration={1000}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-status-${index}`}
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity"
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
