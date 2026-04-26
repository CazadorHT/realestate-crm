"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaAnalytics, DistributionData } from "@/features/dashboard/queries";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/features/properties/labels";

// Custom Glassmorphism Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].fill || payload[0].color }} />
           <p className="text-sm font-bold text-slate-900">{payload[0].value.toLocaleString()} Views</p>
        </div>
      </div>
    );
  }
  return null;
};

// Brand Colors
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

interface AnalyticsChartsProps {
  topAreas: AreaAnalytics[];
  listingTypeDist: DistributionData[];
  propertyTypeDist: DistributionData[];
}

export function AnalyticsCharts({ topAreas, listingTypeDist, propertyTypeDist }: AnalyticsChartsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page"); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  // Format data for Areas
  const areaData = topAreas.slice(0, 5).map(area => ({
    name: area.name,
    views: area.view_count,
    originalValue: area.name,
  }));

  // Format data for Listing Types
  const listingData = listingTypeDist.map(item => ({
    name: LISTING_TYPE_LABELS[item.label as keyof typeof LISTING_TYPE_LABELS] || item.label,
    value: item.value,
    originalValue: item.label,
  }));

  // Format data for Property Types
  const propertyData = propertyTypeDist.map(item => ({
    name: PROPERTY_TYPE_LABELS[item.label as keyof typeof PROPERTY_TYPE_LABELS] || item.label,
    value: item.value,
    originalValue: item.label,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Area Popularity Chart */}
      <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">ย่านยอดนิยม (Top 5 Areas)</CardTitle>
          <CardDescription className="text-xs text-slate-500">สัดส่วนการเข้าชมแบ่งตามพื้นที่</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaData} layout="vertical" margin={{ left: -20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12, fontWeight: 500, fill: "#64748b" }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar 
                dataKey="views" 
                radius={[0, 4, 4, 0]} 
                barSize={24}
                onClick={(data: any) => updateFilters("area", data.originalValue)}
                className="cursor-pointer"
              >
                {areaData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={searchParams.get("area") && searchParams.get("area") !== entry.originalValue ? 0.3 : 1}
                    className="hover:fill-opacity-80 transition-all"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Listing Type Distribution Chart */}
      <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">สัดส่วนตามประเภทดีล</CardTitle>
          <CardDescription className="text-xs text-slate-500">เปรียบเทียบความสนใจ ขาย vs เช่า</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] mt-4 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={listingData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                onClick={(data) => updateFilters("listingType", data.originalValue)}
                className="cursor-pointer"
              >
                {listingData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    fillOpacity={searchParams.get("listingType") && searchParams.get("listingType") !== entry.originalValue ? 0.3 : 1}
                    className="hover:fill-opacity-80 transition-all"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Property Type Distribution Chart */}
      <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">สัดส่วนตามประเภททรัพย์สิน</CardTitle>
          <CardDescription className="text-xs text-slate-500">วิเคราะห์ความต้องการแยกตามประเภท (คอนโด, บ้าน, ที่ดิน ฯลฯ)</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={propertyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                interval={0}
                height={40}
                tick={{ fontSize: 10, fontWeight: 500, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fontWeight: 500, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
                className="cursor-pointer"
              >
                {propertyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:fill-opacity-80 transition-all"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
