"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, History, ShieldAlert } from "lucide-react";

interface ServicesTableTabsProps {
  activeTab: string;
  onViewChange: (view: string) => void;
  activeCount: number;
  trashCount: number;
  onCleanup?: () => void;
  onEmptyTrash?: () => void;
  isPending?: boolean;
}

export function ServicesTableTabs({
  activeTab,
  onViewChange,
  activeCount,
  trashCount,
  onCleanup,
  onEmptyTrash,
  isPending,
}: ServicesTableTabsProps) {

  const isTrashView = activeTab === "trash";

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-2 rounded-[28px] border border-slate-200 shadow-sm backdrop-blur-sm">
      <Tabs value={activeTab} onValueChange={onViewChange} className="w-full lg:w-auto">
        <TabsList className="bg-slate-100/60 p-1.5 rounded-2xl w-full lg:w-auto h-auto min-h-11">
          <TabsTrigger 
            value="active" 
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all relative overflow-visible font-bold text-xs"
          >
            <Eye className="w-4 h-4 mr-2 text-emerald-500" />
            การบริการปกติ
            {activeCount > 0 && (
              <Badge className="ml-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 h-5 text-[10px] font-black rounded-full">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="trash" 
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all relative overflow-visible font-bold text-xs"
          >
            <History className="w-4 h-4 mr-2 text-rose-500" />
            ถังขยะ
            {trashCount > 0 && (
              <Badge className="ml-2 bg-rose-50 text-rose-600 border border-rose-100 px-2 h-5 text-[10px] font-black rounded-full">
                {trashCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
        <div className="hidden xl:flex items-center gap-2 bg-slate-50/80 px-4 h-11 rounded-2xl border border-slate-100 transition-all font-bold text-[10px] text-slate-400 uppercase tracking-widest">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
          <span>Management Mode</span>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onCleanup}
            disabled={isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl border border-slate-200 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md active:scale-95"
            title="ดูแลรักษาพื้นที่จัดเก็บ"
          >
            <History className={`w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors ${isPending ? 'animate-spin' : ''}`} />
            <span>ดูแลรักษา</span>
          </button>

          {isTrashView && trashCount > 0 && (
            <button
              onClick={onEmptyTrash}
              disabled={isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl border border-rose-200 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm shadow-rose-100 hover:shadow-md active:scale-95 animate-in zoom-in-95 duration-300"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ล้างถังขยะ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
