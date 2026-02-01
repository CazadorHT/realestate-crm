import { format, differenceInMonths } from "date-fns";
import { th } from "date-fns/locale";
import { BadgeCent, Calendar } from "lucide-react";
import type { Database } from "@/lib/database.types";

type Deal = Database["public"]["Tables"]["deals"]["Row"];

interface DealFinancialsProps {
  deal: Deal;
  isRent: boolean;
}

export function DealFinancials({ deal, isRent }: DealFinancialsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Commission Card */}
      <div className="rounded-xl border border-slate-200 bg-linear-to-br from-emerald-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <BadgeCent className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            ค่าคอมมิชชั่น
          </span>
        </div>
        <p className="text-2xl font-bold text-emerald-700">
          ฿{(deal.commission_amount || 0).toLocaleString()}
        </p>
      </div>

      {/* Start Date Card */}
      {deal.transaction_date && (
        <div className="rounded-xl border border-slate-200 bg-linear-to-br from-blue-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {isRent ? "เริ่มสัญญา" : "วันโอน"}
            </span>
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {format(new Date(deal.transaction_date), "d MMM yy", {
              locale: th,
            })}
          </p>
        </div>
      )}

      {/* End Date Card */}
      {deal.transaction_end_date && (
        <div className="rounded-xl border border-slate-200 bg-linear-to-br from-purple-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              สิ้นสุดสัญญา
            </span>
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {format(new Date(deal.transaction_end_date), "d MMM yy", {
              locale: th,
            })}
          </p>
        </div>
      )}

      {/* Lease Duration Card */}
      {deal.transaction_date && deal.transaction_end_date && (
        <div className="rounded-xl border border-slate-200 bg-linear-to-br from-amber-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              ระยะเวลาสัญญา
            </span>
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {(() => {
              const months = differenceInMonths(
                new Date(deal.transaction_end_date),
                new Date(deal.transaction_date),
              );
              const years = Math.floor(months / 12);
              const remainingMonths = months % 12;
              if (years > 0 && remainingMonths > 0) {
                return `${years} ปี ${remainingMonths} เดือน`;
              } else if (years > 0) {
                return `${years} ปี`;
              } else {
                return `${months} เดือน`;
              }
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
