import { OwnersTable } from "@/components/owners/OwnersTable";
import Link from "next/link";
import { OwnersStats } from "@/components/owners/OwnersStats";
import {
  getOwnersQuery,
  getOwnersDashboardStatsQuery,
} from "@/features/owners/queries";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function OwnersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const q = sp.q || "";

  const {
    data: owners,
    count,
    totalPages,
  } = await getOwnersQuery({
    q,
    page,
    pageSize: 10,
  });

  const stats = await getOwnersDashboardStatsQuery();

  const makeHref = (newPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", newPage.toString());
    return `/protected/owners?${params.toString()}`;
  };

  const isEmptyState = owners.length === 0 && page === 1 && !q;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Premium Header */}
      <PageHeader
        title="เจ้าของทรัพย์"
        subtitle="จัดการข้อมูลเจ้าของทรัพย์และผู้ติดต่อ"
        count={count}
        icon="userCircle"
        actionLabel="เพิ่มเจ้าของ"
        actionHref="/protected/owners/new"
        actionIcon="userPlus"
        gradient="purple"
      />

      <OwnersStats stats={stats} />

      <div className="space-y-4">
        <SectionTitle
          title="รายการเจ้าของทั้งหมด"
          subtitle="คลิกที่แถวเพื่อดูรายละเอียด"
          color="purple"
        />

        {isEmptyState ? (
          <EmptyState
            icon="userCircle"
            title="ยังไม่มีเจ้าของในระบบ"
            description="เริ่มต้นเพิ่มเจ้าของทรัพย์คนแรกเพื่อจัดการข้อมูลผู้ติดต่อ"
            actionLabel="เพิ่มเจ้าของคนแรก"
            actionHref="/protected/owners/new"
            actionIcon="userPlus"
          />
        ) : (
          <>
            <OwnersTable owners={owners} />

            <div className="flex items-center justify-between text-sm bg-slate-50 rounded-xl p-4 border border-gray-200">
              <div className="text-slate-600 font-medium">
                ทั้งหมด <span className="text-slate-900">{count}</span> รายการ •
                หน้า <span className="text-slate-900">{page}</span> จาก{" "}
                <span className="text-slate-900">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  className={`rounded-lg border border-gray-200 bg-white px-4 py-2 font-medium hover:bg-slate-50 transition-colors ${
                    page <= 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                  href={makeHref(page - 1)}
                  aria-disabled={page <= 1}
                >
                  ← ก่อนหน้า
                </Link>
                <Link
                  className={`rounded-lg border border-gray-200 bg-white px-4 py-2 font-medium hover:bg-slate-50 transition-colors ${
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                  href={makeHref(page + 1)}
                  aria-disabled={page >= totalPages}
                >
                  ถัดไป →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
