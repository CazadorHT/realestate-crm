import {
  getAllDocuments,
  getDocumentSignedUrl,
} from "@/features/documents/actions";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, Download, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { DocumentBtn } from "./DocumentBtn";

export default async function DocumentsPage() {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const documents = await getAllDocuments(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          เอกสาร (Documents)
        </h1>
        <p className="text-slate-500 mt-2">
          รายการเอกสารทั้งหมดในระบบ (ล่าสุด 100 รายการ)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents && documents.length > 0 ? (
          documents.map((doc: any) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-medium truncate max-w-[180px]"
                        title={doc.file_name}
                      >
                        {doc.file_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(doc.size_bytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {doc.document_type}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(doc.created_at), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {doc.owner_type}: {doc.owner_id.slice(0, 8)}...
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <DocumentBtn storagePath={doc.storage_path} />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">ไม่พบเอกสารในระบบ</p>
          </div>
        )}
      </div>
    </div>
  );
}
