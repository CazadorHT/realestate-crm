import { getAllDocuments } from "@/features/documents/actions";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { UploadDocumentDialog } from "./_components/UploadDocumentDialog";
import { DocumentsGrid } from "@/features/documents/components/DocumentsGrid";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DocumentStats } from "@/features/documents/components/DocumentStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { TemplateDialog } from "@/features/documents/components/TemplateDialog";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { Suspense } from "react";

interface DocumentsPageProps {
  searchParams: Promise<{
    tenant?: string;
    page?: string;
    success?: string;
    q?: string;
    type?: string;
  }>;
}

export default async function DocumentsPage(props: DocumentsPageProps) {
  const [authContext, searchParams] = await Promise.all([
    requireAuthContext(),
    props.searchParams,
  ]);
  
  assertStaff(authContext.role);

  const tenantId = searchParams.tenant || authContext.tenantId || "ALL";
  const page = Number(searchParams.page) || 1;
  const q = searchParams.q || "";
  const type = searchParams.type || "ALL";
  const pageSize = 50;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {searchParams.success === "true" && <SuccessAnimation />}
      
      <PageHeader
        title="คลังเอกสาร (Documents)"
        subtitle="จัดการเอกสารและไฟล์แนบทั้งหมดในระบบ"
        icon="fileText"
        gradient="blue"
        actionSlot={
          <div className="flex flex-col lg:flex-row gap-2">
            <TemplateDialog />
            <UploadDocumentDialog tenantId={tenantId} />
          </div>
        }
      />

      <Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-2xl" />}>
        <DocumentsContentSection 
          page={page} 
          pageSize={pageSize} 
          tenantId={tenantId} 
          q={q} 
          type={type} 
        />
      </Suspense>
    </div>
  );
}

/** 🚀 DOCUMENTS PERFORMANCE WRAPPER */

async function DocumentsContentSection({
  page,
  pageSize,
  tenantId,
  q,
  type,
}: {
  page: number;
  pageSize: number;
  tenantId: string;
  q: string;
  type: string;
}) {
  const {
    data: documents,
    count: totalCount,
    globalTotalSize,
  } = await getAllDocuments(page, pageSize, tenantId, q, type);

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
    <>
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
              label: "รวมขนาด (ทั้งหมดที่เข้าข่าย)",
              value: formatSize(globalTotalSize),
              color: "blue",
              icon: "info",
            },
          ]}
        />
      )}
    </>
  );
}
