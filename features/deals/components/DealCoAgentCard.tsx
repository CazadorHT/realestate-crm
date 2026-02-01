import { Users, Phone, Globe } from "lucide-react";

interface DealCoAgentCardProps {
  name: string | null;
  contact: string | null;
  online: string | null;
}

export function DealCoAgentCard({
  name,
  contact,
  online,
}: DealCoAgentCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
          <Users className="h-4 w-4 text-slate-500" />
          ข้อมูล Co-Agent
        </h3>
      </div>
      <div className="p-5">
        {name || contact || online ? (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-3">
              {name && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ชื่อ Co-Agent
                    </p>
                    <p className="font-semibold">{name}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contact && (
                  <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{contact}</span>
                  </div>
                )}
                {online && (
                  <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span>{online}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic py-4 text-center">
            ไม่มีข้อมูล Co-Agent
          </p>
        )}
      </div>
    </div>
  );
}
