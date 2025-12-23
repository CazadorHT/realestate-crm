"use client";

import { useState, useEffect } from "react";
import { DocumentOwnerType, DocumentType } from "../schema";
import {
  getDocumentsByOwner,
  getDocumentSignedUrl,
  deleteDocumentAction,
} from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface DocumentListProps {
  ownerId: string;
  ownerType: DocumentOwnerType;
  refreshTrigger?: number; // Simple prop to trigger refetch
}

export function DocumentList({
  ownerId,
  ownerType,
  refreshTrigger,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    const docs = await getDocumentsByOwner(ownerId, ownerType);
    setDocuments(docs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, [ownerId, ownerType, refreshTrigger]);

  const handleView = async (storagePath: string) => {
    const url = await getDocumentSignedUrl(storagePath);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("ไม่สามารถเปิดไฟล์ได้");
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm("ยืนยันการลบไฟล์?")) return;

    const res = await deleteDocumentAction(id, storagePath);
    if (res.success) {
      toast.success("ลบไฟล์สำเร็จ");
      fetchDocs();
    } else {
      toast.error("ลบไฟล์ไม่สำเร็จ");
    }
  };

  if (loading)
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Loader2 className="animate-spin h-5 w-5 mx-auto" />
      </div>
    );

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
        ยังไม่มีเอกสาร
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="overflow-hidden">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-sm truncate max-w-[200px]">
                  {doc.file_name}
                </div>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span>{doc.document_type}</span>
                  <span>•</span>
                  <span>
                    {format(new Date(doc.created_at), "d MMM yy", {
                      locale: th,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(doc.storage_path)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleDelete(doc.id, doc.storage_path)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
