import { Suspense } from "react";
import { getCoBrokersAction } from "@/features/co-brokers/actions";
import { CoBrokersContent } from "@/features/co-brokers/components/CoBrokersContent";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Metadata } from "next";
import { CoBrokerTour } from "@/features/co-brokers/_components/CoBrokerTour";

export const metadata: Metadata = {
  title: "เครือข่ายคู่ค้า | Real Estate CRM",
  description: "จัดการพาร์ทเนอร์และ Co-brokers ในเครือข่ายธุรกิจของคุณ",
};

// 🛡️ [HARDENING] Force dynamic rendering to prevent "Unauthorized" errors during build
// This page requires a user session to fetch co-broker data.
export const dynamic = "force-dynamic";

export default async function CoBrokersPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <CoBrokerTour />
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
        <CoBrokersContentWrapper />
      </Suspense>
    </div>
  );
}

async function CoBrokersContentWrapper() {
  const result = await getCoBrokersAction();
  const initialData = result.success ? result.data : [];
  return <CoBrokersContent initialData={initialData as any} />;
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
