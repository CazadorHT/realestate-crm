"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const FACILITIES_LIST = [
  { value: "สระว่ายน้ำ", label: "สระว่ายน้ำ (Swimming Pool)" },
  { value: "ฟิตเนส", label: "ห้องฟิตเนส (Gym)" },
  { value: "ห้องซาวน่า/สตรีม", label: "ห้องซาวน่า/สตรีม (Sauna/Steam)" },
  { value: "สวนหย่อม/พื้นที่สีเขียว", label: "สวนหย่อม/พื้นที่สีเขียว (Garden)" },
  { value: "ระบบรักษาความปลอดภัย 24 ชม.", label: "รปภ. 24 ชม. (24h Security)" },
  { value: "กล้องวงจรปิด (cctv)", label: "กล้องวงจรปิด (CCTV)" },
  { value: "เข้า-ออกด้วยคีย์การ์ด (key card access)", label: "เข้า-ออกด้วยคีย์การ์ด (Key Card)" },
  { value: "ที่จอดรถ", label: "ที่จอดรถ (Parking)" },
  { value: "สนามเด็กเล่น", label: "สนามเด็กเล่น (Playground)" },
  { value: "ห้องสมุด/co-working space", label: "ห้องสมุด/Co-working Space" },
  { value: "ล็อบบี้", label: "ล็อบบี้ (Lobby)" },
  { value: "ลิฟต์โดยสาร", label: "ลิฟต์โดยสาร (Elevator)" },
];

interface Step3FacilitiesProps {
  selectedFacilities: string[];
  onFacilityToggle: (val: string) => void;
  dbFeatures: any[];
  groupedFeatures: Record<string, any[]>;
}

export function Step3Facilities({
  selectedFacilities,
  onFacilityToggle,
  dbFeatures,
  groupedFeatures,
}: Step3FacilitiesProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">สิ่งอำนวยความสะดวกโครงการ (Facilities)</h4>
        
        {dbFeatures.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {FACILITIES_LIST.map((fac) => {
              const isChecked = selectedFacilities.includes(fac.value);
              return (
                <label 
                  key={fac.value} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none",
                    isChecked 
                      ? "bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onFacilityToggle(fac.value)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-xs">{fac.label}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFeatures).map(([cat, list]: any) => (
              <div key={cat} className="space-y-3">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">{cat}</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(list || []).map((fac: any) => {
                    const isChecked = selectedFacilities.includes(fac.name);
                    return (
                      <label 
                        key={fac.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none",
                          isChecked 
                            ? "bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold" 
                            : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onFacilityToggle(fac.name)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="text-xs">{fac.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
