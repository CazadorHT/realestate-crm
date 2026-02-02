import { leadStageLabelNullable } from "@/features/leads/labels";
import { RiContactsBookLine } from "react-icons/ri";

interface LeadContactCardProps {
  lead: {
    stage: string | null;
    phone: string | null;
    email: string | null;
    preferences: unknown;
    nationality: string | null;
    is_foreigner: boolean | null;
    note: string | null;
  };
}

export function LeadContactCard({ lead }: LeadContactCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-4 p-5 border-b border-slate-200">
        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center  shrink-0">
          <RiContactsBookLine className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">ข้อมูลติดต่อ</h3>
          <p className="text-xs text-slate-500">รายละเอียดการติดต่อและสถานะ</p>
        </div>
      </div>
      <div className="p-5">
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">สถานะลูกค้า</span>
            <span className="font-medium bg-slate-100 px-2.5 py-1 rounded-md text-xs">
              {leadStageLabelNullable(lead.stage as any)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">เบอร์โทรศัพท์</span>
            <span className="font-medium">
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="hover:underline text-blue-600"
                >
                  {lead.phone}
                </a>
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">อีเมล</span>
            <span className="font-medium truncate max-w-[200px]">
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:underline text-blue-600"
                >
                  {lead.email}
                </a>
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Line ID</span>
            <span className="font-medium">
              {(lead.preferences as any)?.line_id ? (
                <span className="text-emerald-600 font-bold">
                  {(lead.preferences as any).line_id}
                </span>
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ติดต่อออนไลน์</span>
            <span className="font-medium">
              {(lead.preferences as any)?.online_contact || "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">สัญชาติ</span>
            <span className="font-medium">
              {lead.nationality
                ? `${lead.nationality} ${
                    lead.is_foreigner ? "(ต่างชาติ)" : "(ไทย)"
                  }`
                : lead.is_foreigner
                  ? "ต่างชาติ"
                  : "ไทย"}
            </span>
          </div>
          {lead.note && (
            <div className="pt-3 border-t border-slate-200 mt-2">
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1.5">
                บันทึกเพิ่มเติม
              </span>
              <p className="text-sm bg-slate-50 p-3 rounded-lg text-slate-600">
                {lead.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
