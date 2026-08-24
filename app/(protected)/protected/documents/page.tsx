import { getAllDocuments } from "@/features/documents/actions";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { DocumentsPageView } from "@/features/documents/components/DocumentsPageView";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { Suspense } from "react";
import { DocumentWithRelations } from "@/features/documents/types";

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
    <>
      {searchParams.success === "true" && <SuccessAnimation />}
      
      <Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-2xl" />}>
        <DocumentsContentSection 
          page={page} 
          pageSize={pageSize} 
          tenantId={tenantId} 
          q={q} 
          type={type} 
        />
      </Suspense>
    </>
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

  return (
    <DocumentsPageView
      documents={(documents || []) as unknown as DocumentWithRelations[]}
      totalCount={totalCount || 0}
      globalTotalSize={globalTotalSize || 0}
      page={page}
      tenantId={tenantId}
    />
  );
}

