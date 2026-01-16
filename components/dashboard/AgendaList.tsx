import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { AgendaEvent } from "@/features/dashboard/queries";

interface AgendaListProps {
  agenda?: AgendaEvent[];
}

export function AgendaList({ agenda = [] }: AgendaListProps) {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          วาระวันนี้ (Today's Agenda)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-muted ml-2 space-y-6">
          {agenda.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              ไม่มีวาระงานวันนี้
            </div>
          ) : (
            agenda.map((event) => {
              const dotColor =
                event.priority === "high"
                  ? "bg-red-500 ring-red-100"
                  : event.priority === "medium"
                  ? "bg-yellow-500 ring-yellow-100"
                  : "bg-blue-500 ring-blue-100";

              return (
                <div key={event.id} className="ml-4 relative">
                  <div
                    className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ${dotColor}`}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-primary">
                      {event.time}
                    </span>
                    <span className="text-sm font-medium">{event.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground capitalize">
                        {event.type}
                      </span>
                      {event.priority === "high" && (
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/30 px-1 rounded">
                          ด่วน!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
