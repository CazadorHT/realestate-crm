import { getAllDocuments } from "@/features/documents/actions";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { UploadDocumentDialog } from "./_components/UploadDocumentDialog";
import { DocumentsGrid } from "@/features/documents/components/DocumentsGrid";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocumentStats } from "@/features/documents/components/DocumentStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { TemplateDialog } from "@/features/documents/components/TemplateDialog";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";

interface DocumentsPageProps {
  searchParams: Promise<{ tenant?: string; page?: string; success?: string }>;
}

export default async function DocumentsPage(props: DocumentsPageProps) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const searchParams = await props.searchParams;
  const tenantId = searchParams.tenant || (await getActiveTenantCookie()) || "ALL";
  const page = Number(searchParams.page) || 1;
  const pageSize = 50;

  const { data: documents, count: totalCount } = await getAllDocuments(
    page,
    pageSize,
    tenantId,
  );

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  const totalSize = documents.reduce((sum, doc) => sum + (doc.size_bytes || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {searchParams.success === "true" && <SuccessAnimation />}
      
      <PageHeader
        title="คลังเอกสาร (Documents)"
        subtitle="จัดการเอกสารและไฟล์แนบทั้งหมดในระบบ"
        count={totalCount}
        icon="fileText"
        gradient="blue"
        actionSlot={
          <div className="flex gap-2">
            <TemplateDialog />
            <UploadDocumentDialog tenantId={tenantId} />
          </div>
        }
      />

      <DocumentStats documents={documents} />

      <DocumentsGrid
        documents={documents}
        totalCount={totalCount}
        currentPage={page}
        tenantId={tenantId}
      />

      {documents && documents.length > 0 && (
        <TableFooterStats
          totalCount={totalCount}
          unitLabel="ไฟล์"
          secondaryStats={[
            {
              label: "รวมขนาด (หน้าปัจจุบัน)",
              value: formatSize(totalSize),
              color: "blue",
              icon: "info",
            },
          ]}
        />
      )}
    </div>
  );
}
