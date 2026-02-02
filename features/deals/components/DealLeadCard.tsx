import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RiUser3Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";

interface DealLeadCardProps {
  lead: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null; // Allow null to be safe, though usage implies it exists if rendered
}

export function DealLeadCard({ lead }: DealLeadCardProps) {
  if (!lead) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-200">
        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
          <RiUser3Line className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">ลูกค้า (Lead)</h3>
          <p className="text-xs text-slate-500">ข้อมูลผู้สนใจทรัพย์</p>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {lead.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/protected/leads/${lead.id}`}
              className="font-semibold text-lg hover:text-primary transition-colors"
            >
              {lead.full_name || "ไม่ระบุชื่อ"}
            </Link>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              {lead.email && (
                <span className="flex items-center gap-1">📧 {lead.email}</span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1">📱 {lead.phone}</span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/protected/leads/${lead.id}`}>
              ดูลีด
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
