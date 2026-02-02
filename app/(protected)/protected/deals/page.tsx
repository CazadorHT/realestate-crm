import { getDeals } from "@/features/deals/queries.getDeals";
import { getPropertiesForSelect } from "@/features/properties/queries";
import { DealsTable } from "@/features/deals/DealsTable";
import { CreateDealButton } from "./_components/CreateDealButton";
import { requireAuthContext } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Handshake,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const metadata = {
  title: "Deals | จัดการดีล",
};

export default async function DealsPage() {
  await requireAuthContext();

  const { data, count } = await getDeals({ page: 1, pageSize: 100 }); // Get more for stats
  const properties = await getPropertiesForSelect();

  // Calculate statistics
  const totalDeals = data.length;
  const activeDeals = data.filter(
    (d) => d.status === "NEGOTIATING" || d.status === "SIGNED",
  ).length;
  const wonDeals = data.filter((d) => d.status === "CLOSED_WIN").length;
  const lostDeals = data.filter((d) => d.status === "CLOSED_LOSS").length;

  // Calculate total commission from won deals
  const totalCommission = data
    .filter((d) => d.status === "CLOSED_WIN" && d.commission_amount)
    .reduce((sum, d) => sum + (d.commission_amount || 0), 0);

  const isEmptyState = data.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <PageHeader
        title="ดีล (Deals)"
        subtitle="จัดการและติดตามดีลการขายและเช่า"
        count={count}
        icon="handshake"
        gradient="amber"
        actionSlot={<CreateDealButton properties={properties} />}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ดีลทั้งหมด</CardTitle>
            <Handshake className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
            <p className="text-xs text-slate-500 mt-1">Total deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              กำลังดำเนินการ
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeDeals}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปิดการขาย</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{wonDeals}</div>
            <p className="text-xs text-slate-500 mt-1">Won deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยกเลิก</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lostDeals}</div>
            <p className="text-xs text-slate-500 mt-1">Lost deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat("th-TH", {
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 1,
              }).format(totalCommission)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total commission</p>
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Card */}
      {totalDeals > 0 && (
        <Card className="bg-linear-to-r from-blue-50 to-purple-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Win Rate</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {((wonDeals / totalDeals) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  {wonDeals} Won / {lostDeals} Lost
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  จากทั้งหมด {totalDeals} deals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deals Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              รายการดีลทั้งหมด
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              แสดง {data.slice(0, 20).length} จาก {count} ดีล
            </p>
          </div>
          {activeDeals > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {activeDeals} รอดำเนินการ
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-4">
          <DealsTable
            initialData={data.slice(0, 20)}
            initialCount={count}
            initialPage={1}
            pageSize={20}
            properties={properties}
          />
        </div>
      </div>

      {/* Footer Stats */}
      {data.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {totalDeals} ดีล</span>
            {activeDeals > 0 && (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <Clock className="h-4 w-4" />
                {activeDeals} กำลังดำเนินการ
              </span>
            )}
            {wonDeals > 0 && (
              <span className="text-green-600 font-medium">
                {wonDeals} สำเร็จ
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs">
              อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
