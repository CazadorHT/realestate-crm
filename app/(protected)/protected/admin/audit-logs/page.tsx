import { requireAuthContext, assertAdmin } from "@/lib/authz";
import {
  getAuditLogs,
  getAllUsers,
  autoPurgeOldLogs,
} from "@/features/admin/queries";
import { AuditLogsPageView } from "./AuditLogsPageView";
import { Metadata } from "next";

export const metadata: Metadata = {
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
  const pageSize = 30;

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
    <AuditLogsPageView
      data={data}
      count={count}
      users={users}
      currentPage={currentPage}
      pageSize={pageSize}
    />
  );
}

