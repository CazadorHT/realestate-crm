"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { refineBlogPostAction } from "@/features/blog/actions";
import { startProcess, finishProcess } from "@/lib/process-monitor";

interface BlogContentRefinerProps {
  currentContent: string;
  onRefined: (newContent: string) => void;
}

export function BlogContentRefiner({
  currentContent,
  onRefined,
}: BlogContentRefinerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refineType, setRefineType] = useState("grammar");
  const [customInstruction, setCustomInstruction] = useState("");

  // Hide button if no content
  if (!currentContent || currentContent.trim().length === 0) {
    return null;
  }

  const handleRefine = async () => {
    if (!currentContent) {
      toast.error("ไม่พบเนื้อหาที่ต้องการปรับปรุง");
      return;
    }

    if (refineType === "custom" && !customInstruction.trim()) {
      toast.error("กรุณาระบุคำสั่งสำหรับ AI");
      return;
    }

    const processId = startProcess("AI กำลังปรับปรุงเนื้อหา", {
      type: "BLOG_AI_REFINE",
      onRetry: handleRefine
    });
    setIsLoading(true);

    try {
      const result = await refineBlogPostAction(
        currentContent,
        customInstruction,
        refineType,
      );

      if (result.success && result.refinedContent) {
        onRefined(result.refinedContent);
        finishProcess(processId, "SUCCESS", "ปรับปรุงเนื้อหาสำเร็จ ✨");
        setIsOpen(false);
      } else {
        const msg = result.message || "เกิดข้อผิดพลาดในการปรับปรุงเนื้อหา";
        finishProcess(processId, "ERROR", msg);
        toast.error(msg);
      }
    } catch (error: unknown) {
      console.error("Refine error:", error);
      const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="gap-2 h-12 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm"
        >
          <Wand2 className="h-4 w-4" />
          <span className="hidden sm:inline">AI Refine</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Wand2 className="h-5 w-5 text-indigo-600" />
            </div>
            <DialogTitle className="text-xl">
              ปรับปรุงเนื้อหาด้วย AI
            </DialogTitle>
          </div>
          <DialogDescription>
            เลือกรูปแบบกระสั่ง เพื่อให้ AI
            ช่วยปรับปรุงเนื้อหาปัจจุบันให้ดียิ่งขึ้น
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">เลือกคำสั่ง</Label>
            <Select value={refineType} onValueChange={setRefineType}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="เลือกรูปแบบการปรับปรุง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grammar">
                  🛠️ แก้คำผิด / เรียบเรียงประโยค
                </SelectItem>
                <SelectItem value="professional">
                  👔 ปรับให้ดูมืออาชีพ (Professional)
                </SelectItem>
                <SelectItem value="expand">
                  📝 ขยายความให้ละเอียดขึ้น
                </SelectItem>
                <SelectItem value="summarize">📌 สรุปใจความสำคัญ</SelectItem>
                <SelectItem value="custom">
                  ✨ กำหนดคำสั่งเอง (Custom)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {refineType === "custom" && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                คำสั่งเพิ่มเติม
              </Label>
              <Textarea
                placeholder="เช่น เปลี่ยนจากการใช้คำว่า 'ผม' เป็น 'ดิฉัน', เพิ่มตัวอย่างประกอบ..."
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500">
            <p className="flex items-center gap-2 mb-1 font-medium text-slate-700">
              <CheckCircle2 className="h-3 w-3" />
              หมายเหตุ:
            </p>
            AI จะทำการเขียนเนื้อหาใหม่ทั้งหมดตามคำสั่ง โดยยังคงโครงสร้าง HTML
            เดิมไว้ เพื่อไม่ให้การจัดหน้าเสียรูปทรง
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={handleRefine}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            ปรับปรุงเนื้อหา
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
