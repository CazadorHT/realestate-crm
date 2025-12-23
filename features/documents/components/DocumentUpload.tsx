"use client";

import { useState } from "react";
import { DocumentOwnerType, DocumentType, DocumentTypeEnum } from "../schema";
import { createDocumentRecordAction } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface DocumentUploadProps {
  ownerId: string;
  ownerType: DocumentOwnerType;
  onUploadComplete?: () => void;
}

export function DocumentUpload({
  ownerId,
  ownerType,
  onUploadComplete,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("OTHER");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${ownerType}/${ownerId}/${uuidv4()}.${fileExt}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);

      // 2. Create DB Record
      const res = await createDocumentRecordAction({
        owner_id: ownerId,
        owner_type: ownerType,
        document_type: docType,
        file_name: file.name,
        storage_path: fileName,
        mime_type: file.type,
        size_bytes: file.size,
      });

      if (!res.success) throw new Error(res.message);

      toast.success("อัปโหลดเอกสารสำเร็จ");
      setFile(null);
      if (onUploadComplete) onUploadComplete();
    } catch (error: any) {
      console.error(error);
      toast.error("อัปโหลดล้มเหลว: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-muted/5">
      <div className="space-y-2">
        <Label>ประเภทเอกสาร</Label>
        <Select
          value={docType}
          onValueChange={(v) => setDocType(v as DocumentType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DocumentTypeEnum.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>เลือกไฟล์</Label>
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        อัปโหลด
      </Button>
    </div>
  );
}
