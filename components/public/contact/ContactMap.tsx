"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export function ContactMap() {
  return (
    <div className="mt-12">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-slate-100 h-[400px] flex items-center justify-center">
            <div className="text-center text-slate-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p className="font-medium">แผนที่ Google Maps</p>
              <p className="text-sm mt-1">
                เพิ่ม Google Maps embed code ที่นี่
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
