import {
  getAllDocuments,
  getDocumentSignedUrl,
} from "@/features/documents/actions";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Eye,
  Download,
  Calendar,
  User,
  Upload,
  File,
  Image,
  FileArchive,
  HardDrive,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { DocumentBtn } from "./DocumentBtn";
import { UploadDocumentDialog } from "./_components/UploadDocumentDialog";
import Link from "next/link";

export default async function DocumentsPage() {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const documents = await getAllDocuments(200);

  // Calculate statistics
  const totalDocuments = documents?.length || 0;
  const totalSize =
    documents?.reduce((sum, doc: any) => sum + (doc.size_bytes || 0), 0) || 0;

  // Group by document type
  const typeGroups =
    documents?.reduce((acc: any, doc: any) => {
      const type = doc.document_type || "OTHER";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

  // Get most common types
  const topTypes = Object.entries(typeGroups)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  // Format total size
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            เอกสาร
          </h1>
          <p className="text-slate-500 mt-2">
            จัดการเอกสารและไฟล์แนบทั้งหมดในระบบ
          </p>
        </div>
        <UploadDocumentDialog />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอกสารทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-slate-500 mt-1">Total files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ขนาดรวม</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatSize(totalSize)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ประเภทเอกสาร</CardTitle>
            <File className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(typeGroups).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Document types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัพโหลดล่าสุด</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documents && documents.length > 0
                ? format(new Date(documents[0].created_at), "d MMM", {
                    locale: th,
                  })
                : "-"}
            </div>
            <p className="text-xs text-slate-500 mt-1">Latest upload</p>
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      {topTypes.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">
                ประเภทเอกสารยอดนิยม
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topTypes.map(([type, count]: any) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="bg-white border-purple-200 text-purple-700"
                >
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents && documents.length > 0 ? (
            documents.map((doc: any) => (
              <Card
                key={doc.id}
                className="hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-200">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-semibold truncate text-slate-900"
                          title={doc.file_name}
                        >
                          {doc.file_name}
                        </div>
                        <div className="text-sm text-slate-500 font-medium">
                          {formatSize(doc.size_bytes || 0)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {doc.document_type}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {format(new Date(doc.created_at), "d MMM yyyy HH:mm", {
                        locale: th,
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-xs">
                        {doc.owner_type === "PROPERTY" &&
                        doc.property?.title ? (
                          <>
                            ทรัพย์:{" "}
                            <span className="font-medium">
                              {doc.property.title}
                            </span>
                          </>
                        ) : doc.owner_type === "LEAD" && doc.lead ? (
                          <>
                            ลีด:{" "}
                            <span className="font-medium">
                              {doc.lead.full_name || doc.lead.email}
                            </span>
                          </>
                        ) : doc.owner_type === "DEAL" &&
                          doc.deal?.property?.title ? (
                          <>
                            ดีล:{" "}
                            <span className="font-medium">
                              {doc.deal.property.title}
                            </span>
                          </>
                        ) : doc.owner_type === "RENTAL_CONTRACT" &&
                          doc.rental_contract?.property?.title ? (
                          <>
                            สัญญา:{" "}
                            <span className="font-medium">
                              {doc.rental_contract.property.title}
                            </span>
                          </>
                        ) : (
                          <>
                            {doc.owner_type}:{" "}
                            <span className="font-mono text-xs">
                              {doc.owner_id.slice(0, 12)}...
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <DocumentBtn storagePath={doc.storage_path} />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold text-lg">
                ไม่พบเอกสารในระบบ
              </p>
              <p className="text-slate-400 text-sm mt-2">
                อัพโหลดเอกสารแรกของคุณเพื่อเริ่มต้น
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      {documents && documents.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {totalDocuments} ไฟล์</span>
            <span className="text-blue-600 font-medium">
              {formatSize(totalSize)} รวม
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs">
              อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
