import { MapPin, Map, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PopularAreasStatsProps {
  totalAreas: number;
  totalProperties: number;
}

export function PopularAreasStats({
  totalAreas,
  totalProperties,
}: PopularAreasStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ทำเลทั้งหมด</CardTitle>
          <MapPin className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAreas}</div>
          <p className="text-xs text-slate-500 mt-1">Popular areas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ทรัพย์ในทำเล</CardTitle>
          <Map className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {totalProperties}
          </div>
          <p className="text-xs text-slate-500 mt-1">Properties with area</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">เฉลี่ยต่อทำเล</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {totalAreas > 0 ? Math.round(totalProperties / totalAreas) : 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Avg properties/area</p>
        </CardContent>
      </Card>
    </div>
  );
}
