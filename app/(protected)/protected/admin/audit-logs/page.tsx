import { requireAuthContext, assertAdmin } from "@/lib/authz";
import {
  getAuditLogs,
  getAllUsers,
  autoPurgeOldLogs,
} from "@/features/admin/queries"; // Added autoPurgeOldLogs
import { AuditLogTable } from "@/features/admin/components/AuditLogTable";
import { AuditLogFilters } from "@/features/admin/components/AuditLogFilters"; // Added Filter Component
import { PaginationControls } from "@/components/ui/pagination-controls";
import { History } from "lucide-react";
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <History className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Audit Logs
            </h1>
            <p className="text-muted-foreground text-sm">
              ประวัติการใช้งานระบบและการเปลี่ยนแปลงข้อมูลทั้งหมด
            </p>
          </div>
        </div>
        <PurgeLogsButton />
      </div>

      {/* Filter Component */}
      <AuditLogFilters users={users} />

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
