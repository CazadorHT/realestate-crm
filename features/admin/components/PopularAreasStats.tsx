"use client";

import { MapPin, Map, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/language-context";

interface PopularAreasStatsProps {
  totalAreas: number;
  totalProperties: number;
}

export function PopularAreasStats({
  totalAreas,
  totalProperties,
}: PopularAreasStatsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Total Areas" : "ทำเลทั้งหมด"}
          </CardTitle>
          <MapPin className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAreas}</div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "Registered popular areas" : "ทำเลยอดนิยมในระบบ"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Properties in Areas" : "ทรัพย์ในทำเล"}
          </CardTitle>
          <Map className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {totalProperties}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "Properties linked to area" : "รายการทรัพย์สินที่ผูกทำเล"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isEn ? "Average per Area" : "เฉลี่ยต่อทำเล"}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {totalAreas > 0 ? Math.round(totalProperties / totalAreas) : 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? "Avg properties per area" : "เฉลี่ยทรัพย์สินต่อหนึ่งทำเล"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

