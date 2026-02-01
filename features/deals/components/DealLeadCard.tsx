import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
          <Users className="h-4 w-4 text-slate-500" />
          ลูกค้า (Lead)
        </h3>
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
