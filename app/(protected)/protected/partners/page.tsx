import {
  getPartners,
  getPartnersDashboardStats,
} from "@/features/admin/partners-actions";
import { PartnersStats } from "@/components/admin/PartnersStats";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PartnersTable } from "@/features/admin/components/PartnersTable";

export default async function PartnersPage() {
  const partners = await getPartners();
  const stats = await getPartnersDashboardStats();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">จัดการพาร์ทเนอร์ (Partners)</h1>
        <Link href="/protected/partners/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มพาร์ทเนอร์
          </Button>
        </Link>
      </div>

      <PartnersStats stats={stats} />

      <PartnersTable partners={partners ?? []} />
    </div>
  );
}
