"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isToday, isTomorrow } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Calendar, ArrowRight, Video, Home, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { CalendarEvent } from "@/features/calendar/queries";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface UpcomingEventsProps {
  events: CalendarEvent[];
  role?: string;
  view?: string;
}

export function UpcomingEvents({ events, role, view = "personal" }: UpcomingEventsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isAdminView = (role === "ADMIN" || role === "MANAGER" || role === "OWNER") && view !== "personal";
  
  const getEventDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return isEn ? "Today" : "วันนี้";
    if (isTomorrow(date)) return isEn ? "Tomorrow" : "พรุ่งนี้";
    return format(date, "d MMM", { locale: isEn ? enUS : th });
  };

  const getEventTypeConfig = (type: string) => {
    switch (type) {
      case "viewing":
        return {
          icon: <Video className="h-3.5 w-3.5" />,
          className: "bg-blue-50 text-blue-600 border-blue-100",
          label: isEn ? "Property Viewing" : "พาชมทรัพย์",
        };
      case "contract_end":
        return {
          icon: <FileText className="h-3.5 w-3.5" />,
          className: "bg-rose-50 text-rose-600 border-rose-100",
          label: isEn ? "Contract Expiry" : "หมดสัญญา",
        };
      case "deal_closing":
        return {
          icon: <Home className="h-3.5 w-3.5" />,
          className: "bg-emerald-50 text-emerald-600 border-emerald-100",
          label: isEn ? "Deal Closing" : "ปิดดีล",
        };
      default:
        return {
          icon: <Calendar className="h-3.5 w-3.5" />,
          className: "bg-slate-50 text-slate-600 border-slate-100",
          label: isEn ? "Appointment" : "นัดหมาย",
        };
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 shadow-sm min-h-[350px] max-h-[520px] h-auto border-slate-100 overflow-hidden group hover:shadow-md transition-all duration-500 rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-slate-50/50">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-800">{isEn ? "Upcoming Schedule" : "นัดหมายเร็วๆ นี้"}</CardTitle>
          <p className="text-xs text-muted-foreground">{isEn ? "Appointments & events in the next 7 days" : "รายการนัดหมายใน 7 วันข้างหน้า"}</p>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="p-3 bg-slate-50 rounded-full">
                <Calendar className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-muted-foreground">{isEn ? "No upcoming events scheduled" : "ไม่มีนัดหมายในช่วงเวลานี้"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => {
                const config = getEventTypeConfig(event.type);
                return (
                  <div
                    key={event.id}
                    className="group/item flex items-start gap-4 p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all duration-200"
                  >
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 shadow-sm ${config.className} border transition-transform group-hover/item:scale-110`}>
                      {config.icon}
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-700 truncate block group-hover/item:text-blue-700 transition-colors">
                          {event.title}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isToday(new Date(event.start)) ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                          {getEventDateLabel(event.start)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(event.start), "HH:mm")} {isEn ? "" : "น."}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 font-medium border-none ${config.className}`}>
                          {config.label}
                        </Badge>
                        {isAdminView && (event as any).agentName && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                             <span>• {isEn ? "By" : "โดย"}: {(event as any).agentName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-slate-50">
          <Link
            href="/protected/calendar"
            className="group/link w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-300"
          >
            {isEn ? "View Full Calendar" : "ดูปฏิทินทั้งหมด"} 
            <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
