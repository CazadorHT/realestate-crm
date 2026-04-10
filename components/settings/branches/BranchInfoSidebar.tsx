"use client";

import { Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BranchInfoSidebarProps {
  branch: {
    name: string;
    slug: string;
    created_at: string;
  } | null;
  onEdit: () => void;
}

export function BranchInfoSidebar({ branch, onEdit }: BranchInfoSidebarProps) {
  if (!branch) return null;

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-[32px] p-8 shadow-sm overflow-hidden relative">
      <div className="absolute -right-10 -top-10 h-32 w-32 bg-indigo-50/50 rounded-full blur-2xl" />
      
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Building2 size={20} className="text-indigo-600" />
        เกี่ยวกับสาขา
      </h3>

      <div className="space-y-5">
        <div className="p-4 bg-white/60 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">ชื่อทางการ</p>
          <p className="font-bold text-slate-900">{branch.name}</p>
        </div>
        
        <div className="p-4 bg-white/60 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Slug Identifier</p>
          <p className="font-mono text-xs text-slate-600">{branch.slug}</p>
        </div>

        <div className="p-4 bg-white/60 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">วันที่ก่อตั้ง</p>
          <p className="text-sm font-semibold text-slate-700">
            {new Date(branch.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100">
        <Button 
          variant="ghost" 
          className="w-full justify-between rounded-2xl h-12 text-slate-500 hover:text-indigo-600 hover:bg-white group border border-dashed border-slate-200"
          onClick={onEdit}
        >
          ตั้งค่าข้อมูลสาขา
          <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
