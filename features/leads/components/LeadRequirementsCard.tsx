"use client";

import {
  Target,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Users,
  Ruler,
  PawPrint,
  Cigarette,
  Home,
  Building2,
  DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type LeadPreferences } from "../types";

interface LeadRequirementsCardProps {
  lead: {
    preferred_locations: string[] | null;
    budget_min: number | null;
    budget_max: number | null;
    min_bedrooms: number | null;
    min_bathrooms: number | null;
    min_size_sqm: number | null;
    max_size_sqm: number | null;
    num_occupants: number | null;
    has_pets: boolean | null;
    preferred_property_types: string[] | null;
    need_company_registration: boolean | null;
    allow_airbnb: boolean | null;
    preferences: LeadPreferences | null;
  };
}

export function LeadRequirementsCard({ lead }: LeadRequirementsCardProps) {

  return (
    <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5">
      <div className="flex items-center gap-4 p-5 border-b border-slate-50 bg-slate-50/20">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800 tracking-tight">ความต้องการของลูกค้า</h3>
          <p className="text-[11px] text-slate-400 font-medium">สเปกและคุณสมบัติอสังหาฯ ที่กำลังมองหา</p>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Location & Budget */}
          <div className="grid gap-4">
            <div className="flex items-start gap-3 group/row">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-blue-50 group-hover/row:text-blue-600 transition-colors shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ทำเลที่สนใจ</span>
                <p className="text-sm font-semibold text-slate-700 leading-snug">
                  {lead.preferred_locations && lead.preferred_locations.length > 0
                    ? lead.preferred_locations.join(", ")
                    : <span className="text-slate-300 font-normal">ไม่ระบุ</span>}
                </p>
              </div>
            </div>

            {lead.preferred_property_types && lead.preferred_property_types.length > 0 && (
              <div className="flex items-start gap-3 group/row">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-blue-50 group-hover/row:text-blue-600 transition-colors shrink-0">
                  <Home className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ประเภทอสังหาฯ</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.preferred_property_types.map((type) => (
                      <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold ring-1 ring-blue-100">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 group/row">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-emerald-50 group-hover/row:text-emerald-600 transition-colors shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">งบประมาณ</span>
                <p className="text-sm font-semibold text-emerald-600">
                  {lead.budget_min || lead.budget_max ? (
                    <>
                      {lead.budget_min ? `฿${lead.budget_min.toLocaleString()}` : "0"}
                      {" - "}
                      {lead.budget_max ? `฿${lead.budget_max.toLocaleString()}` : "ไม่จำกัด"}
                    </>
                  ) : (
                    <span className="text-slate-300 font-normal">ไม่ระบุ</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Room Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col items-center gap-1 hover:bg-white hover:shadow-md transition-all duration-300">
              <Bed className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-500">ห้องนอน</span>
              <span className="text-lg font-semibold text-slate-800">{lead.min_bedrooms ?? "0"}</span>
            </div>
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col items-center gap-1 hover:bg-white hover:shadow-md transition-all duration-300">
              <Bath className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-500">ห้องน้ำ</span>
              <span className="text-lg font-semibold text-slate-800">{lead.min_bathrooms ?? "0"}</span>
            </div>
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col items-center gap-1 hover:bg-white hover:shadow-md transition-all duration-300">
              <Ruler className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-500">ขนาด (ตร.ม.)</span>
              <span className="text-sm font-semibold text-slate-800">
                {lead.min_size_sqm || lead.max_size_sqm 
                  ? `${lead.min_size_sqm ?? 0}-${lead.max_size_sqm ?? "?"}` 
                  : "0"}
              </span>
            </div>
          </div>

          {/* Other Details */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block">จำนวนผู้พักอาศัย</span>
                <span className="text-xs font-semibold text-slate-700">{lead.num_occupants ? `${lead.num_occupants} คน` : "-"}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                lead.has_pets ? "bg-amber-50" : "bg-slate-50"
              )}>
                <PawPrint className={cn("h-3.5 w-3.5", lead.has_pets ? "text-amber-600" : "text-slate-400")} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block">การเลี้ยงสัตว์</span>
                <span className="text-xs font-semibold text-slate-700">{lead.has_pets ? "เลี้ยงสัตว์" : "ไม่มีสัตว์เลี้ยง"}</span>
              </div>
            </div>
          </div>

          {/* Conditional Needs */}
          {(lead.need_company_registration || lead.allow_airbnb) && (
             <div className="grid grid-cols-2 gap-4 pb-2">
                {lead.need_company_registration && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 ring-1 ring-indigo-100">
                      <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-widest block leading-none">จดทะเบียนบริษัท</span>
                      <span className="text-[11px] font-semibold text-indigo-700">ต้องการ</span>
                    </div>
                  </div>
                )}
                {lead.allow_airbnb && (
                   <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 ring-1 ring-rose-100">
                      <DoorOpen className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-widest block leading-none">ทำ Airbnb</span>
                      <span className="text-[11px] font-semibold text-rose-700">ต้องการ</span>
                    </div>
                  </div>
                )}
             </div>
          )}

          {/* Smoker Preference */}
          <div className="pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Cigarette className={cn("h-4 w-4", lead.preferences?.is_smoker ? "text-rose-500" : "text-slate-400")} />
                <span className="text-xs font-semibold text-slate-500">การสูบบุหรี่</span>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded",
                lead.preferences?.is_smoker ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
              )}>
                {lead.preferences?.is_smoker ? "สูบบุหรี่" : "ไม่สูบบุหรี่"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
