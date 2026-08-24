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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useLanguage } from "@/lib/i18n/language-context";

interface BlogContentRefinerProps {
  currentContent: string;
  onRefined: (newContent: string) => void;
}

export function BlogContentRefiner({
  currentContent,
  onRefined,
}: BlogContentRefinerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

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
      toast.error(isEn ? "No content found to refine" : "ไม่พบเนื้อหาที่ต้องการปรับปรุง");
      return;
    }

    if (refineType === "custom" && !customInstruction.trim()) {
      toast.error(isEn ? "Please specify instructions for AI" : "กรุณาระบุคำสั่งสำหรับ AI");
      return;
    }

    const processId = startProcess(isEn ? "AI Refining Content..." : "AI กำลังปรับปรุงเนื้อหา", {
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
        finishProcess(processId, "SUCCESS", isEn ? "Content refined successfully ✨" : "ปรับปรุงเนื้อหาสำเร็จ ✨");
        setIsOpen(false);
      } else {
        const msg = result.message || (isEn ? "Failed to refine content" : "เกิดข้อผิดพลาดในการปรับปรุงเนื้อหา");
        finishProcess(processId, "ERROR", msg);
        toast.error(msg);
      }
    } catch (error: unknown) {
      console.error("Refine error:", error);
      const msg = error instanceof Error ? error.message : (isEn ? "Failed to communicate with AI" : "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="gap-2 h-12 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer font-semibold"
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">{isEn ? "Refine with AI" : "ขัดเกลาเนื้อหา"}</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-indigo-600 text-white border-indigo-500">
          {isEn ? "Use AI to polish writing style and tone" : "ใช้พลัง AI ช่วยปรับปรุงสำนวนและการเขียนให้ดูเป็นมืออาชีพยิ่งขึ้น"}
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Wand2 className="h-5 w-5 text-indigo-600" />
            </div>
            <DialogTitle className="text-xl">
              {isEn ? "Refine Content with AI" : "ปรับปรุงเนื้อหาด้วย AI"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEn
              ? "Select an action for AI to refine and polish your current article text."
              : "เลือกรูปแบบคำสั่ง เพื่อให้ AI ช่วยปรับปรุงเนื้อหาปัจจุบันให้ดียิ่งขึ้น"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">
              {isEn ? "Refinement Mode" : "เลือกคำสั่ง"}
            </Label>
            <Select value={refineType} onValueChange={setRefineType}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={isEn ? "Select refinement mode" : "เลือกรูปแบบการปรับปรุง"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grammar">
                  {isEn ? "🛠️ Fix Grammar & Rephrase" : "🛠️ แก้คำผิด / เรียบเรียงประโยค"}
                </SelectItem>
                <SelectItem value="professional">
                  {isEn ? "👔 Make Professional & Authoritative" : "👔 ปรับภาษาให้เป็นทางการและน่าเชื่อถือ"}
                </SelectItem>
                <SelectItem value="expand">
                  {isEn ? "📝 Expand & Elaborate Detail" : "📝 ขยายความให้ละเอียดขึ้น"}
                </SelectItem>
                <SelectItem value="summarize">
                  {isEn ? "📌 Summarize Key Points" : "📌 สรุปใจความสำคัญ"}
                </SelectItem>
                <SelectItem value="custom">
                  {isEn ? "✨ Custom Instruction" : "✨ กำหนดคำสั่งเอง"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {refineType === "custom" && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                {isEn ? "Custom Instructions" : "คำสั่งเพิ่มเติม"}
              </Label>
              <Textarea
                placeholder={isEn ? "e.g. Change tone to first-person plural, add specific property tax examples..." : "เช่น เปลี่ยนจากการใช้คำว่า 'ผม' เป็น 'ดิฉัน', เพิ่มตัวอย่างประกอบ..."}
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500">
            <p className="flex items-center gap-2 mb-1 font-medium text-slate-700">
              <CheckCircle2 className="h-3 w-3" />
              {isEn ? "Note:" : "หมายเหตุ:"}
            </p>
            {isEn
              ? "AI will rewrite the content while preserving the HTML structure and layout."
              : "AI จะทำการเขียนเนื้อหาใหม่ทั้งหมดตามคำสั่ง โดยยังคงโครงสร้าง HTML เดิมไว้ เพื่อไม่ให้การจัดหน้าเสียรูปทรง"}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button
            type="button"
            onClick={handleRefine}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px] cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isEn ? "Refine Now" : "ปรับปรุงเนื้อหา"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

