"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar, ArrowRight, Video, Home, FileText } from "lucide-react";
import Link from "next/link";
import { CalendarEvent } from "@/features/calendar/queries";
import { Badge } from "@/components/ui/badge";

interface UpcomingEventsProps {
  events: CalendarEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 shadow-sm border-slate-100 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">นัดหมายเร็วๆ นี้</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="max-h-[250px] overflow-y-auto space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-3 text-sm text-muted-foreground">
              ไม่มีนัดหมายใน 7 วันนี้
            </div>
          ) : (
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                >
                  <div
                    className={`mt-1 p-1.5 rounded-full shrink-0 ${
                      event.type === "viewing"
                        ? "bg-blue-100 text-blue-600"
                        : event.type === "contract_end"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                    }`}
                  >
                    {event.type === "viewing" && <Video className="h-3 w-3" />}
                    {event.type === "contract_end" && (
                      <FileText className="h-3 w-3" />
                    )}
                    {event.type === "deal_closing" && (
                      <Home className="h-3 w-3" />
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-sm font-medium leading-none truncate block">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-slate-700">
                        {format(new Date(event.start), "d MMM", { locale: th })}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(event.start), "HH:mm")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link
            href="/protected/calendar"
            className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
          >
            ดูปฏิทินทั้งหมด <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
