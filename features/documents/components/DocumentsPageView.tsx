"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocumentStats } from "./DocumentStats";
import { DocumentsGrid } from "./DocumentsGrid";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { TemplateDialog } from "./TemplateDialog";
import { UploadDocumentDialog } from "@/app/(protected)/protected/documents/_components/UploadDocumentDialog";
import { DocumentWithRelations } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface DocumentsPageViewProps {
  documents: DocumentWithRelations[];
  totalCount: number;
  globalTotalSize: number;
  page: number;
  tenantId: string;
}

export function DocumentsPageView({
  documents,
  totalCount,
  globalTotalSize,
  page,
  tenantId,
}: DocumentsPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

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
      <PageHeader
        title={isEn ? "Documents Repository" : "คลังเอกสาร"}
        subtitle={
          isEn
            ? "Manage and track all documents and attachments"
            : "จัดการเอกสารและไฟล์แนบทั้งหมดในระบบ"
        }
        icon="fileText"
        gradient="blue"
        breadcrumbs={[
          { label: isEn ? "Dashboard" : "แดชบอร์ด", href: "/protected" },
          { label: isEn ? "Documents" : "คลังเอกสาร" },
        ]}
        actionSlot={
          <div className="flex flex-col lg:flex-row gap-2">
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
          unitLabel={isEn ? "files" : "ไฟล์"}
          secondaryStats={[
            {
              label: isEn ? "Total Size (Matching)" : "รวมขนาด (ทั้งหมดที่เข้าข่าย)",
              value: formatSize(globalTotalSize),
              color: "blue",
              icon: "info",
            },
          ]}
        />
      )}
    </div>
  );
}
