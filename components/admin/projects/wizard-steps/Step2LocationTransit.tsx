/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Train, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type MasterDataTransitStation } from "@/features/properties/actions/fetch-master-data";

function getTransitLogoInfo(code: string, transitType?: string) {
  const c = code.toUpperCase();
  const t = (transitType || "").toUpperCase();
  
  if (c.startsWith("BTS") || t === "BTS") {
    return {
      logo: "/images/transit/BTS-Logo.svg",
      bg: "bg-emerald-50/40 border-emerald-200 text-emerald-800",
      lineName: "BTS",
    };
  }
  if (c.startsWith("ARL") || t === "ARL") {
    return {
      logo: "/images/transit/ARLbangkok.svg",
      bg: "bg-red-50/40 border-red-200 text-red-800",
      lineName: "Airport Link",
    };
  }
  if (c.startsWith("BRT") || t === "BRT") {
    return {
      logo: "/images/transit/Bangkok_BRT_logo.svg",
      bg: "bg-green-50/40 border-green-200 text-green-800",
      lineName: "BRT",
    };
  }
  if (c.includes("YELLOW") || t === "MRT_YELLOW" || t === "YELLOW") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
      bg: "bg-amber-50/40 border-amber-200 text-amber-800",
      lineName: "MRT Yellow",
    };
  }
  if (c.includes("PINK") || t === "MRT_PINK" || t === "PINK") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
      bg: "bg-pink-50/40 border-pink-200 text-pink-800",
      lineName: "MRT Pink",
    };
  }
  if (c.includes("PURPLE") || t === "MRT_PURPLE" || t === "PURPLE") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
      bg: "bg-purple-50/40 border-purple-200 text-purple-800",
      lineName: "MRT Purple",
    };
  }
  if (c.includes("ORANGE") || t === "MRT_ORANGE" || t === "ORANGE") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
      bg: "bg-orange-50/40 border-orange-200 text-orange-800",
      lineName: "MRT Orange",
    };
  }
  if (c.startsWith("MRT") || t === "MRT" || t === "MRT_BLUE") {
    return {
      logo: "/images/transit/MRT_(Bangkok)_logo.svg",
      bg: "bg-blue-50/40 border-blue-200 text-blue-800",
      lineName: "MRT Blue",
    };
  }
  if (c.startsWith("SRT") || t === "SRT" || t === "SRT_RED") {
    return {
      logo: "/images/transit/SRT_Red_Lines_icon.svg",
      bg: "bg-rose-50/40 border-rose-200 text-rose-800",
      lineName: "SRT Red",
    };
  }
  
  return {
    logo: null,
    bg: "bg-slate-50 border-slate-200 text-slate-700",
    lineName: transitType || "Train",
  };
}

interface Step2LocationTransitProps {
  googleMapsUrl: string;
  onGoogleMapsUrlChange: (val: string) => void;
  lat: string;
  lng: string;
  province: string;
  setProvince: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  subdistrict: string;
  setSubdistrict: (val: string) => void;
  selectedStationCodes: string[];
  setSelectedStationCodes: React.Dispatch<React.SetStateAction<string[]>>;
  stationDistancesMap: Record<string, string>;
  setStationDistancesMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  stations: MasterDataTransitStation[];
  onOpenStationSelector: () => void;
  setIsFormDirty: (val: boolean) => void;
}

export function Step2LocationTransit({
  googleMapsUrl,
  onGoogleMapsUrlChange,
  lat,
  lng,
  province,
  setProvince,
  district,
  setDistrict,
  subdistrict,
  setSubdistrict,
  selectedStationCodes,
  setSelectedStationCodes,
  stationDistancesMap,
  setStationDistancesMap,
  stations,
  onOpenStationSelector,
  setIsFormDirty,
}: Step2LocationTransitProps) {
  const parseDistanceToMeters = React.useCallback((val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^\d.]/g, "");
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    if (num <= 15) {
      return Math.round(num * 1000);
    }
    return Math.round(num);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">ที่ตั้งและการเดินทาง</h4>
        
        <div className="space-y-2">
          <Label htmlFor="googleMapsUrl" className="text-sm font-bold text-slate-700">ลิงก์ปักหมุด Google Maps</Label>
          <Input
            id="googleMapsUrl"
            value={googleMapsUrl}
            onChange={(e) => onGoogleMapsUrlChange(e.target.value)}
            placeholder="วางลิงก์ปักหมุด Google Maps เช่น https://maps.app.goo.gl/... หรือ https://www.google.com/maps/place/..."
            className="h-10.5 rounded-xl border-slate-200"
          />
          <p className="text-[10px] text-slate-400 font-medium">ระบบจะแกะพิกัด Latitude และ Longitude ผูกเข้าฐานข้อมูลให้อัตโนมัติ (พิกัดปัจจุบัน: Lat: {lat || "-"} / Lng: {lng || "-"})</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm font-bold text-slate-700">จังหวัด</Label>
            <Input
              id="province"
              value={province}
              onChange={(e) => { setProvince(e.target.value); setIsFormDirty(true); }}
              placeholder="กรุงเทพมหานคร"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district" className="text-sm font-bold text-slate-700">เขต / อำเภอ</Label>
            <Input
              id="district"
              value={district}
              onChange={(e) => { setDistrict(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น เขตวัฒนา"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subdistrict" className="text-sm font-bold text-slate-700">แขวง / ตำบล</Label>
            <Input
              id="subdistrict"
              value={subdistrict}
              onChange={(e) => { setSubdistrict(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น พระโขนงเหนือ"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Label className="text-sm font-bold text-slate-700">สถานีรถไฟฟ้าใกล้เคียง & ระยะห่าง</Label>
          
          <div className="space-y-3">
            {selectedStationCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Train className="w-8 h-8 mb-2 text-slate-300" />
                <span className="text-xs font-semibold">ยังไม่ได้เลือกสถานีรถไฟฟ้าใกล้เคียง</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedStationCodes.map((code) => {
                  const stat = stations.find((s) => s.code === code);
                  const labelTh = stat ? stat.label.th : code;
                  const labelEn = stat ? stat.label.en : "";
                  const transitType = stat?.metadata?.transit_type || "BTS";
                  const logoInfo = getTransitLogoInfo(code, transitType);
                  
                  const distanceVal = stationDistancesMap[code] || "";
                  const parsedMeters = parseDistanceToMeters(distanceVal);
                  const displayFormatted = parsedMeters > 0 
                    ? parsedMeters >= 1000 
                      ? `${(parsedMeters / 1000).toFixed(1)} กิโลเมตร`
                      : `${parsedMeters} เมตร`
                    : "";

                  return (
                    <div 
                      key={code}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-sm transition-all duration-200 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider shrink-0", logoInfo.bg)}>
                          {logoInfo.logo ? (
                            <img src={logoInfo.logo} alt={transitType} className="h-4.5 w-auto object-contain shrink-0" />
                          ) : (
                            <span>{transitType}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 leading-snug">{labelTh}</span>
                          <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{labelEn} ({code})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                          <span className="text-xs text-slate-500 font-bold shrink-0">ระยะห่าง</span>
                          <div className="relative flex items-center">
                            <Input
                              type="text"
                              value={distanceVal}
                              onChange={(e) => {
                                setStationDistancesMap(prev => ({
                                  ...prev,
                                  [code]: e.target.value
                                }));
                                setIsFormDirty(true);
                              }}
                              placeholder="0.5 , 500"
                              className="w-full placeholder:font-medium placeholder:text-xs placeholder:line-clamp-1  sm:w-32 h-9 text-xs rounded-xl border-slate-200 pr-7 focus-visible:ring-indigo-500"
                            />
                            {distanceVal && (
                              <span className="absolute right-2.5 text-[9px] text-slate-400 font-bold uppercase">
                                {parseDistanceToMeters(distanceVal) <= 15 ? "กม." : "ม."}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {displayFormatted && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-extrabold shrink-0">
                            ➔ {displayFormatted}
                          </span>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStationCodes(prev => prev.filter(c => c !== code));
                            setStationDistancesMap(prev => {
                              const copy = { ...prev };
                              delete copy[code];
                              return copy;
                            });
                            setIsFormDirty(true);
                          }}
                          className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={onOpenStationSelector}
              className="w-full h-11 rounded-2xl border-slate-200 text-slate-700! hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <Train className="w-4.5 h-4.5 text-indigo-600 animate-bounce" style={{ animationDuration: "2.5s" }} />
              เพิ่มสถานีรถไฟฟ้าใกล้เคียง
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
