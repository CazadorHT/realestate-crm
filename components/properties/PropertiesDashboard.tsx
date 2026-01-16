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

// Thai labels mapping
const TYPE_LABELS: Record<string, string> = {
  CONDO: "คอนโด",
  HOUSE: "บ้านเดี่ยว",
  TOWNHOUSE: "ทาวน์เฮ้าส์",
  LAND: "ที่ดิน",
  COMMERCIAL: "อาคารพาณิชย์",
  Unknown: "ไม่ระบุ",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "ว่าง (Available)",
  SOLD: "ขายแล้ว (Sold)",
  RENTED: "เช่าแล้ว (Rented)",
  RESERVED: "จองแล้ว (Reserved)",
  Unknown: "ไม่ระบุ",
};

const COLORS = [
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
  // Transform data for charts
  const typeData = stats.byType.map((item) => ({
    name: TYPE_LABELS[item.name] || item.name,
    value: item.value,
  }));

  const statusData = stats.byStatus.map((item) => ({
    name: STATUS_LABELS[item.name] || item.name,
    value: item.value,
  }));

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
              บาท (เฉพาะรายการขาย)
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
                  >
                    {typeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, "จำนวน"]}
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
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
