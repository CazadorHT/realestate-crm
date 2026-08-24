"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { getDocumentSignedUrl } from "@/features/documents/actions";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";

export function DocumentBtn({ storagePath }: { storagePath: string }) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const handleOpen = async () => {
    try {
      const url = await getDocumentSignedUrl(storagePath);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error(isEn ? "Unable to open file (link expired or invalid file)" : "ไม่สามารถเปิดไฟล์ได้ (ลิงก์หมดอายุหรือไฟล์ไม่ถูกต้อง)");
      }
    } catch (error) {
      toast.error(isEn ? "Error opening file" : "เกิดข้อผิดพลาดในการเปิดไฟล์");
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="w-full cursor-pointer"
      onClick={handleOpen}
    >
      <Eye className="mr-2 h-3.5 w-3.5" />
      {isEn ? "View Document" : "เปิดดู"}
    </Button>
  );
}
