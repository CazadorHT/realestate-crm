import { Suspense } from "react";
import { getCoBrokersAction } from "@/features/co-brokers/actions";
import { CoBrokersContent } from "@/features/co-brokers/components/CoBrokersContent";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const metadata = {
  title: "เครือข่ายคู่ค้า | Real Estate CRM",
  description: "จัดการพาร์ทเนอร์และ Co-brokers ในเครือข่ายธุรกิจของคุณ",
};

export default async function CoBrokersPage() {
  const result = await getCoBrokersAction();
  const initialData = result.success ? result.data : [];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <PageHeader
        title="เครือข่ายคู่ค้า (Co-Brokers)"
        subtitle="จัดการข้อมูลพาร์ทเนอร์, ตรวจสอบผลงาน และตำแหน่งพื้นที่เชี่ยวชาญ"
        icon="users"
        gradient="blue"
        breadcrumbs={[
          { label: "แดชบอร์ด", href: "/protected" },
          { label: "เครือข่ายคู่ค้า" },
        ]}
      />

      <Suspense fallback={<CoBrokersLoading />}>
        <CoBrokersContent initialData={initialData as any} />
      </Suspense>
    </div>
  );
}

function CoBrokersLoading() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-[250px]" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
