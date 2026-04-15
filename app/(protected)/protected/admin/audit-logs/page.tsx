import { requireAuthContext, assertAdmin } from "@/lib/authz";
import {
  getAuditLogs,
  getAllUsers,
  autoPurgeOldLogs,
} from "@/features/admin/queries"; // Added autoPurgeOldLogs
import { AuditLogTable } from "@/features/admin/components/AuditLogTable";
import { AuditLogFilters } from "@/features/admin/components/AuditLogFilters"; // Added Filter Component
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { History as HistoryIcon } from "lucide-react";
import { PurgeLogsButton } from "@/features/admin/components/PurgeLogsButton";

export const metadata = {
  title: "Audit Logs | Admin",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    action?: string;
    entity?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  // 1. Security Check
  const { role } = await requireAuthContext();
  assertAdmin(role);

  // 2. Parse Params
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const pageSize = 30; // Increased default pageSize

  // Silently purge old logs (older than 30 days) on page load
  await autoPurgeOldLogs();

  // Filters
  const filters = {
    action: params.action,
    entity: params.entity,
    userId: params.userId,
    startDate: params.startDate,
    endDate: params.endDate,
  };

  // 3. Fetch Data (Parallel)
  const [logsResult, users] = await Promise.all([
    getAuditLogs({
      page: currentPage,
      pageSize,
      filters,
     }),
    getAllUsers(),
  ]);

  const { data, count } = logsResult; 

  return (
    <div className="p-6 space-y-10 max-w-screen-2xl mx-auto py-8">
      <SettingsHeader 
      
        title={<>บันทึกประวัติ <span className="text-blue-600">Audit Logs</span></>}
        description="ตรวจสอบประวัติการใช้งานระบบและการเปลี่ยนแปลงข้อมูลทั้งหมดอย่างละเอียด"
        subPath={[
          { label: "System Control", href: "/protected/settings" },
          { label: "Log Management" },
          { label: "Audit Logs (ประวัติระบบ)" }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <HistoryIcon className="h-3.5 w-3.5" />
              Retaining last 30 days
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
