"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const FACILITIES_LIST = [
  { value: "สระว่ายน้ำ", th: "สระว่ายน้ำ", en: "Swimming Pool" },
  { value: "ฟิตเนส", th: "ห้องฟิตเนส", en: "Fitness / Gym" },
  { value: "ห้องซาวน่า/สตรีม", th: "ห้องซาวน่า/สตรีม", en: "Sauna / Steam Room" },
  { value: "สวนหย่อม/พื้นที่สีเขียว", th: "สวนหย่อม / พื้นที่สีเขียว", en: "Garden / Green Area" },
  { value: "ระบบรักษาความปลอดภัย 24 ชม.", th: "รปภ. 24 ชม.", en: "24-Hour Security" },
  { value: "กล้องวงจรปิด", th: "กล้องวงจรปิด", en: "CCTV Security" },
  { value: "เข้า-ออกด้วยคีย์การ์ด", th: "เข้า-ออกด้วยคีย์การ์ด", en: "Key Card Access" },
  { value: "ที่จอดรถ", th: "ที่จอดรถ", en: "Parking" },
  { value: "สนามเด็กเล่น", th: "สนามเด็กเล่น", en: "Playground" },
  { value: "ห้องสมุด/co-working space", th: "ห้องสมุดและพื้นที่ทำงาน", en: "Library / Co-working Space" },
  { value: "ล็อบบี้", th: "ล็อบบี้", en: "Lobby Reception" },
  { value: "ลิฟต์โดยสาร", th: "ลิฟต์โดยสาร", en: "Passenger Elevator" },
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
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">
          {isEn ? "Project Amenities & Facilities" : "สิ่งอำนวยความสะดวกโครงการ"}
        </h4>
        
        {dbFeatures.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {FACILITIES_LIST.map((fac) => {
              const isChecked = selectedFacilities.includes(fac.value);
              const label = isEn ? fac.en : fac.th;
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
                  <span className="text-xs">{label}</span>
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
                        <span className="text-xs">{isEn ? (fac.name_en || fac.name) : fac.name}</span>
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

