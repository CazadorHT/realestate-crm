import { getAllDocuments } from "@/features/documents/actions";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UploadDocumentDialog } from "./_components/UploadDocumentDialog";
import { DocumentsGrid } from "@/features/documents/components/DocumentsGrid";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocumentStats } from "@/features/documents/components/DocumentStats";
import { DocumentWithRelations } from "@/features/documents/types";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";

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
        actionSlot={<UploadDocumentDialog />}
      />

      {/* Statistics Cards */}
      <DocumentStats documents={documents} />

      {/* Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              รายการเอกสารทั้งหมด
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              แสดง {documents?.length || 0} เอกสาร
            </p>
          </div>
          {/* Search - Placeholder */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="ค้นหาเอกสาร..." className="pl-10" disabled />
          </div>
        </div>

        {/* Documents Grid */}
        <DocumentsGrid documents={documents || []} />
      </div>

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
