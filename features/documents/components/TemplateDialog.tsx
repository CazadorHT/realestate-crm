"use client";

import { useState, useEffect } from "react";
import { getTemplatesAction } from "../template-actions";
import { generateDocumentFromTemplateAction } from "../generation-actions";
import { DOC_TYPE_LABELS } from "../schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TemplateDialogProps {
  ownerId: string;
  ownerType: "LEAD" | "PROPERTY" | "DEAL" | "RENTAL_CONTRACT";
  onGenerateComplete?: () => void;
  trigger?: React.ReactNode;
}

export function TemplateDialog({
  ownerId,
  ownerType,
  trigger,
  onGenerateComplete,
}: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  async function loadTemplates() {
    try {
      const data = await getTemplatesAction();
      setTemplates(data || []);
      if (data && data.length > 0) {
        setSelectedTemplateId(data[0].id);
      }
    } catch (err) {
      toast.error("โหลดต้นแบบสัญญาไม่สำเร็จ");
    }
  }

  async function handleGenerate() {
    if (!ownerId) {
      toast.error("ไม่พบข้อมูลผู้รับเอกสาร (Owner Context Missing)");
      return;
    }

    if (!selectedTemplateId) {
      toast.error("กรุณาเลือกต้นแบบสัญญา");
      return;
    }

    setLoading(true);
    try {
      const res = await generateDocumentFromTemplateAction(
        selectedTemplateId,
        ownerId,
        ownerType,
      );

      if (res.success) {
        toast.success("สร้างเอกสารสำเร็จแล้ว!");
        setOpen(false);
        if (onGenerateComplete) onGenerateComplete();
        router.refresh();
      } else {
        toast.error(res.message || "สร้างเอกสารไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Generate Document UI Error:", err);
      toast.error("เกิดข้อผิดพลาดในการสร้างเอกสาร");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="gap-2">
            <FileText className="h-4 w-4" />
            สร้างจาก Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-600" />
            สร้างเอกสารอัตโนมัติ
          </DialogTitle>
          <DialogDescription>
            เลือกต้นแบบสัญญาที่ต้องการ
            ระบบจะดึงข้อมูลจากระบบมาใส่ให้โดยอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">เลือกต้นแบบ (Template)</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={loading}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="เลือกต้นแบบ..." />
              </SelectTrigger>
              <SelectContent className="z-200">
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({DOC_TYPE_LABELS[t.type] || t.type})
                  </SelectItem>
                ))}
                {templates.length === 0 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    ยังไม่มีต้นแบบในระบบ
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 border border-blue-100">
            <p className="font-semibold mb-1">💡 ข้อมูลที่จะดึงมาใส่:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>ชื่อ-นามสกุล และที่อยู่ (จาก {ownerType})</li>
              <li>ข้อมูลทรัพย์สิน (กรณีเป็น Deal หรือ Property)</li>
              <li>ราคาและเงื่อนไขต่างๆ</li>
              <li>วันที่ปัจจุบัน</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedTemplateId}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              "ยืนยันการสร้างเอกสาร"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
