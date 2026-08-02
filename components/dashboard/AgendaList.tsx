"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  Phone, 
  Video, 
  CheckSquare, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import type { AgendaEvent } from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AgendaListProps {
  agenda?: AgendaEvent[];
  role?: string;
  view?: string; // company, branch, team, personal
}

const typeIcons = {
  meeting: <Video className="h-3 w-3" />,
  call: <Phone className="h-3 w-3" />,
  task: <CheckSquare className="h-3 w-3" />,
  deadline: <AlertCircle className="h-3 w-3" />,
};

const typeLabels = {
  meeting: "นัดหมาย",
  call: "โทรศัพท์",
  task: "งานทั่วไป",
  deadline: "กำหนดส่ง",
};

export function AgendaList({ agenda = [], role, view = "personal" }: AgendaListProps) {
  const isAdminView = (role === "ADMIN" || role === "MANAGER" || role === "OWNER") && view !== "personal";

  return (
    <Card className="shadow-sm min-h-[250px] max-h-[520px] h-auto border-slate-200 overflow-hidden flex flex-col rounded-3xl transition-all duration-500">
      <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
            วาระงานวันนี้
          </CardTitle>
          <div className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {agenda.length} งาน
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="px-6 py-5">
          {agenda.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 bg-slate-50 rounded-full">
                <Clock className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium italic">วันนี้ไม่มีวาระงานที่ต้องจัดการ</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {agenda.map((event, index) => {
                const isHigh = event.priority === "high";
                const isMedium = event.priority === "medium";
                
                const dotColor = isHigh 
                  ? "bg-rose-500 ring-rose-100 shadow-rose-200" 
                  : isMedium 
                    ? "bg-amber-500 ring-amber-100 shadow-amber-200" 
                    : "bg-blue-500 ring-blue-100 shadow-blue-200";

                return (
                  <div key={event.id} className="relative pl-8 group transition-all duration-300">
                    {/* Timeline Dot */}
                    <div className={cn(
                      "absolute left-0 top-1.5 h-3 w-3 rounded-full ring-4 z-10 shadow-sm transition-transform group-hover:scale-125",
                      dotColor
                    )} />
                    
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[11px] font-bold tracking-tight",
                          isHigh ? "text-rose-600" : "text-indigo-600"
                        )}>
                          {event.time}
                        </span>
                        {isHigh && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase animate-pulse">
                            <AlertCircle size={10} /> ด่วน
                          </span>
                        )}
                      </div>

                      <div className="group/item flex flex-col p-3 rounded-2xl border border-slate-100 bg-white shadow-xs group-hover:shadow-md group-hover:border-indigo-100 transition-all duration-300">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight mb-2 group-hover/item:text-indigo-600 transition-colors">
                          {event.title}
                        </h4>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                              {typeIcons[event.type]}
                              {typeLabels[event.type]}
                            </div>
                            
                            {/* สำหรับ Admin/Manager: แสดงเจ้าของงาน (ถ้ามีข้อมูลในอนาคต) */}
                            {isAdminView && (event as any).agentName && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                <span>• โดย: {(event as any).agentName}</span>
                              </div>
                            )}
                          </div>
                          
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50 hover:text-indigo-600">
                            <ChevronRight size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Footer Quick Action */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-bold bg-white hover:bg-indigo-600 hover:text-white transition-all group shadow-xs">
          ดูตารางงานทั้งหมด
          <ExternalLink size={12} className="ml-2 opacity-50 group-hover:opacity-100" />
        </Button>
      </div>
    </Card>
  );
}
