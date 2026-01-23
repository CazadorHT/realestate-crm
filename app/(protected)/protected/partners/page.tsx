import {
  getPartners,
  getPartnersDashboardStats,
} from "@/features/admin/partners-actions";
import { PartnersStats } from "@/components/admin/PartnersStats";

import { PartnersTable } from "@/features/admin/components/PartnersTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default async function PartnersPage() {
  const partners = await getPartners();
  const stats = await getPartnersDashboardStats();

  const isEmptyState = !partners || partners.length === 0;

  return (
    <div className="p-6 space-y-6">
      {/* Premium Header */}
      <PageHeader
        title="พาร์ทเนอร์ (Partners)"
        subtitle="จัดการพาร์ทเนอร์และบริษัทที่ร่วมงาน"
        count={partners?.length || 0}
        icon="handshake"
        actionLabel="เพิ่มพาร์ทเนอร์"
        actionHref="/protected/partners/new"
        actionIcon="plus"
        gradient="rose"
      />

      <PartnersStats stats={stats} />

      <div className="space-y-4">
        <SectionTitle
          title="รายการพาร์ทเนอร์ทั้งหมด"
          subtitle="คลิกที่แถวเพื่อดูรายละเอียด"
          color="rose"
        />

        {isEmptyState ? (
          <EmptyState
            icon="handshake"
            title="ยังไม่มีพาร์ทเนอร์ในระบบ"
            description="เริ่มต้นเพิ่มพาร์ทเนอร์แรกเพื่อแสดงโลโก้บนหน้าเว็บไซต์"
            actionLabel="เพิ่มพาร์ทเนอร์แรก"
            actionHref="/protected/partners/new"
            actionIcon="plus"
          />
        ) : (
          <PartnersTable partners={partners ?? []} />
        )}
      </div>
    </div>
  );
}
