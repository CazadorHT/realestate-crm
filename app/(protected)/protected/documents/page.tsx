import { getAllDocuments } from "@/features/documents/actions";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { UploadDocumentDialog } from "./_components/UploadDocumentDialog";
import { DocumentsGrid } from "@/features/documents/components/DocumentsGrid";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocumentStats } from "@/features/documents/components/DocumentStats";
import { DocumentWithRelations } from "@/features/documents/types";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { TemplateDialog } from "@/features/documents/components/TemplateDialog";

export default async function DocumentsPage() {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const documents = (await getAllDocuments(200)) as DocumentWithRelations[];
  const totalDocuments = documents?.length || 0;
  const totalSize =
    documents?.reduce((sum, doc) => sum + (doc.size_bytes || 0), 0) || 0;

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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Premium Header */}
      <PageHeader
        title="เอกสาร (Documents)"
        subtitle="จัดการเอกสารและไฟล์แนบทั้งหมดในระบบ"
        count={totalDocuments}
        icon="fileText"
        gradient="blue"
        actionSlot={
          <div className="flex gap-2">
            <TemplateDialog />
            <UploadDocumentDialog />
          </div>
        }
      />

      {/* Statistics Cards */}
      <DocumentStats documents={documents} />

      {/* Documents Grid */}
      <DocumentsGrid documents={documents || []} />

      {/* Footer Stats */}
      {documents && documents.length > 0 && (
        <TableFooterStats
          totalCount={totalDocuments}
          unitLabel="ไฟล์"
          secondaryStats={[
            {
              label: "รวม",
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
