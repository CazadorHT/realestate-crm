import { Button } from "@/components/ui/button";
import { OwnersTable } from "@/components/owners/OwnersTable";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { OwnersStats } from "@/components/owners/OwnersStats";
import {
  getOwnersQuery,
  getOwnersDashboardStatsQuery,
} from "@/features/owners/queries";

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">เจ้าของทรัพย์</h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลเจ้าของทรัพย์และผู้ติดต่อ
          </p>
        </div>
        <Button asChild>
          <Link href="/protected/owners/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            เพิ่มเจ้าของ
          </Link>
        </Button>
      </div>

      <OwnersStats stats={stats} />

      <OwnersTable owners={owners} />

      <div className="flex items-center justify-between text-sm border-t pt-4">
        <div className="text-muted-foreground">
          ทั้งหมด {count} รายการ • หน้า {page} จาก {totalPages}
        </div>
        <div className="flex gap-2">
          <Link
            className={`rounded-md border px-3 py-1 hover:bg-muted ${
              page <= 1 ? "pointer-events-none opacity-50" : ""
            }`}
            href={makeHref(page - 1)}
            aria-disabled={page <= 1}
          >
            ก่อนหน้า
          </Link>
          <Link
            className={`rounded-md border px-3 py-1 hover:bg-muted ${
              page >= totalPages ? "pointer-events-none opacity-50" : ""
            }`}
            href={makeHref(page + 1)}
            aria-disabled={page >= totalPages}
          >
            ถัดไป
          </Link>
        </div>
      </div>
    </div>
  );
}
