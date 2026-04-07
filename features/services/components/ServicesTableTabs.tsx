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
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
      <Tabs value={activeTab} onValueChange={onViewChange} className="w-full sm:w-auto">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl w-full sm:w-auto">
          <TabsTrigger 
            value="active" 
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all relative overflow-visible"
          >
            <Eye className="w-4 h-4 mr-2 text-emerald-500" />
            การบริการปกติ
            {activeCount > 0 && (
              <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-none px-1.5 h-5 text-[10px] font-black">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="trash" 
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all relative overflow-visible"
          >
            <History className="w-4 h-4 mr-2 text-rose-500" />
            ถังขยะ
            {trashCount > 0 && (
              <Badge className="ml-2 bg-rose-100 text-rose-700 border-none px-1.5 h-5 text-[10px] font-black">
                {trashCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
          <ShieldAlert className="w-3 h-3" />
          โหมดการจัดการสินทรัพย์บริการ
        </div>
        
        <button
          onClick={onCleanup}
          disabled={isPending}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm active:scale-95"
          title="ดูแลรักษาพื้นที่จัดเก็บ"
        >
          <History className={`w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors ${isPending ? 'animate-spin' : ''}`} />
          <span>ดูแลรักษาพื้นที่จัดเก็บ</span>
        </button>

        {isTrashView && trashCount > 0 && (
          <button
            onClick={onEmptyTrash}
            disabled={isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm shadow-rose-100 active:scale-95 animate-in slide-in-from-right-4 duration-300"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ล้างถังขยะทั้งหมด</span>
          </button>
        )}
      </div>
    </div>
  );
}
