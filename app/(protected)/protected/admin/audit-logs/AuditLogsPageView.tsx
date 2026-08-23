"use client";

import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { History as HistoryIcon } from "lucide-react";
import { PurgeLogsButton } from "@/features/admin/components/PurgeLogsButton";
import { AuditLogFilters } from "@/features/admin/components/AuditLogFilters";
import { AuditLogTable } from "@/features/admin/components/AuditLogTable";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useLanguage } from "@/lib/i18n/language-context";
import { AuditLogWithUser } from "@/features/admin/queries";

interface AuditLogsPageViewProps {
  data: AuditLogWithUser[];
  count: number;
  users: { id: string; full_name: string | null; email: string | null }[];
  currentPage: number;
  pageSize: number;
}

export function AuditLogsPageView({
  data,
  count,
  users,
  currentPage,
  pageSize,
}: AuditLogsPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="p-6 space-y-10 max-w-screen-2xl mx-auto py-8">
      <SettingsHeader 
        title={
          <>
            {isEn ? "Audit " : "บันทึกประวัติ "}
            <span className="text-blue-600">Audit Logs</span>
          </>
        }
        description={
          isEn
            ? "Inspect system events, user operations, and data changes recorded across the CRM"
            : "ตรวจสอบประวัติการใช้งานระบบและการเปลี่ยนแปลงข้อมูลทั้งหมดอย่างละเอียด"
        }
        subPath={[
          { label: isEn ? "System Control" : "System Control", href: "/protected/settings" },
          { label: isEn ? "Log Management" : "การจัดการ Log" },
          { label: isEn ? "Audit Logs" : "Audit Logs (ประวัติระบบ)" }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <HistoryIcon className="h-3.5 w-3.5" />
              {isEn ? "Retaining last 30 days" : "จัดเก็บย้อนหลัง 30 วัน"}
            </div>
            <PurgeLogsButton />
          </div>
        }
      />

      {/* Filter Component */}
      <AuditLogFilters users={users} totalCount={count} />

      <AuditLogTable data={data} />

      <div className="flex justify-center lg:justify-end">
        <PaginationControls
          totalCount={count}
          pageSize={pageSize}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}
