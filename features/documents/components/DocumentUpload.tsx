"use client";

import { useState } from "react";
import {
  DocumentOwnerType,
  DocumentType,
  DocumentTypeEnum,
  DOC_TYPE_LABELS,
} from "../schema";
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
import { Loader2, Trash, UploadCloud } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface DocumentUploadProps {
  ownerId: string;
  ownerType: DocumentOwnerType;
  onUploadComplete?: () => void;
  parentId?: string; // If provided, new uploads will be versions of this document
}

export function DocumentUpload({
  ownerId,
  ownerType,
  onUploadComplete,
  parentId,
}: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; type: DocumentType }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/html",
    "text/plain",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles: { file: File; type: DocumentType }[] = [];
      let rejectedSize = 0;
      let rejectedType = 0;

      filesArray.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          rejectedSize++;
          return;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          // Check extension as fallback for some systems
          const ext = file.name.split(".").pop()?.toLowerCase();
          const allowedExts = [
            "pdf",
            "jpg",
            "jpeg",
            "png",
            "webp",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "html",
            "txt",
          ];
          if (!ext || !allowedExts.includes(ext)) {
            rejectedType++;
            return;
          }
        }
        validFiles.push({
          file,
          type: "OTHER" as DocumentType,
        });
      });

      if (rejectedSize > 0) {
        toast.error(`พบ ${rejectedSize} ไฟล์ที่มีขนาดเกิน 20MB และถูกยกเว้น`);
      }
      if (rejectedType > 0) {
        toast.error(
          `พบ ${rejectedType} ไฟล์ที่มีนามสกุลไม่รองรับ และถูกยกเว้น`,
        );
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
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

          let fileToUpload: File | Blob = file;
          let finalSize = file.size;

          // Compress PDF before upload
          if (
            file.type === "application/pdf" ||
            file.type === "application/x-pdf"
          ) {
            try {
              const arrayBuffer = await file.arrayBuffer();
              const { PDFDocument } = await import("pdf-lib");

              // Load and compress PDF
              const pdfDoc = await PDFDocument.load(arrayBuffer);
              const compressedBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 50,
              });

              const originalSize = file.size;
              const compressedSize = compressedBytes.byteLength;
              const savedBytes = originalSize - compressedSize;
              const compressionRatio = (savedBytes / originalSize) * 100;

              // Only use compressed version if it's significantly smaller (>5%)
              if (compressionRatio > 5) {
                fileToUpload = new Blob([compressedBytes as BlobPart], {
                  type: "application/pdf",
                });
                finalSize = compressedSize;
              }
            } catch (pdfError) {
              console.error(
                "PDF compression failed, uploading original:",
                pdfError,
              );
              // Continue with original file
            }
          }

          // 1. Upload to Storage
          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, fileToUpload);

          if (uploadError) throw new Error(uploadError.message);

          // 2. Create DB Record (use final size after compression)
          const res = await createDocumentRecordAction({
            owner_id: ownerId,
            owner_type: ownerType,
            document_type: type,
            file_name: file.name,
            storage_path: fileName,
            mime_type: file.type,
            size_bytes: finalSize,
            parent_id: parentId,
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
            (failCount > 0 ? ` (ล้มเหลว ${failCount})` : ""),
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
    <div className="space-y-4 border border-slate-200 p-4 rounded-lg bg-muted/5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          เลือกไฟล์เอกสาร (ได้หลายไฟล์)
        </Label>

        <Input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="cursor-pointer "
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            รายการไฟล์ที่เลือก
          </Label>
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 -mr-2">
            {selectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 p-3 border border-slate-200 rounded-md bg-background shadow-sm"
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
                    <Trash className="h-4 w-4" />{" "}
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
                      <SelectValue placeholder="เลือกประเภท..." />
                    </SelectTrigger>
                    <SelectContent className="z-200">
                      {DocumentTypeEnum.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {DOC_TYPE_LABELS[option] || option}
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
              className="flex-2"
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
