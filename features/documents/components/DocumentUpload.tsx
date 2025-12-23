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
import { Separator } from "@/components/ui/separator";
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
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; type: DocumentType }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        type: "OTHER" as DocumentType,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const updateFileType = (index: number, type: DocumentType) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated[index].type = type;
      return updated;
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);

    let successCount = 0;
    let failCount = 0;

    try {
      const supabase = createClient();

      for (const item of selectedFiles) {
        try {
          const { file, type } = item;
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
            document_type: type,
            file_name: file.name,
            storage_path: fileName,
            mime_type: file.type,
            size_bytes: file.size,
          });

          if (!res.success) throw new Error(res.message);
          successCount++;
        } catch (err: any) {
          console.error(`Failed to upload ${item.file.name}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `อัปโหลดสำเร็จ ${successCount} ไฟล์` +
            (failCount > 0 ? ` (ล้มเหลว ${failCount})` : "")
        );
        setSelectedFiles([]);
        if (onUploadComplete) onUploadComplete();
      } else if (failCount > 0) {
        toast.error(`อัปโหลดล้มเหลวทั้งหมด ${failCount} ไฟล์`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-muted/5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          เลือกไฟล์เอกสาร (ได้หลายไฟล์)
        </Label>
        <Input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="cursor-pointer"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            รายการไฟล์ที่เลือก
          </Label>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {selectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 p-3 border rounded-md bg-background shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {item.file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <Loader2 className="h-4 w-4" />{" "}
                    {/* Swap with Trash later or just Loader if uploading */}
                  </Button>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs shrink-0 font-medium">ประเภท:</span>
                  <Select
                    value={item.type}
                    onValueChange={(v) =>
                      updateFileType(index, v as DocumentType)
                    }
                    disabled={uploading}
                  >
                    <SelectTrigger className="h-8 text-xs">
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
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
              className="flex-1"
              size="sm"
            >
              ล้างทั้งหมด
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-[2]"
              size="sm"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              เริ่มอัปโหลด ({selectedFiles.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
