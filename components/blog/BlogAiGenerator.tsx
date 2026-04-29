"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  Loader2,
  Target,
  Type,
  MessageSquare,
  AlertCircle,
  MonitorX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlignJustify } from "lucide-react";
import { generateBlogPostAction } from "@/features/blog/actions";
import { toast } from "sonner";
import { AiUsageMonitor } from "@/components/ai-monitor/AiUsageMonitor";
import { startProcess, finishProcess } from "@/lib/process-monitor";

import { BlogAiResult } from "@/features/blog/types";

interface BlogAiGeneratorProps {
  onGenerated: (data: BlogAiResult) => void;
}

export function BlogAiGenerator({ onGenerated }: BlogAiGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [includeImage, setIncludeImage] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error("กรุณาระบุ Focus Keyword");
      return;
    }

    const processId = startProcess(`สร้างบทความ AI: ${keyword}`, {
      type: "BLOG_AI_GEN",
      onRetry: handleGenerate
    });
    setIsLoading(true);

    try {
      const result = await generateBlogPostAction(
        keyword,
        targetAudience,
        tone,
        length,
        includeImage,
      );

      onGenerated(result);

      if (includeImage && !result.cover_image) {
        finishProcess(processId, "SUCCESS", "สร้างบทความสำเร็จ 📝 แต่ระบบรูปภาพขัดข้องชั่วคราว", {
          resultLink: `/blog/${result.slug}`
        });
        toast.warning("สร้างบทความสำเร็จ 📝 แต่ระบบรูปภาพขัดข้องชั่วคราว (Pollinations API 502)");
      } else {
        finishProcess(processId, "SUCCESS", "สร้างบทความด้วย AI สำเร็จแล้ว! ✨", {
          resultLink: `/blog/${result.slug}`
        });
      }

      setIsOpen(false);
    } catch (error: unknown) {
      console.error("AI Generation Error:", error);
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างบทความ";
      // Remove "Error: " prefix if present from server serialization
      const cleanMessage = errorMessage.replace(/^Error: /, "");

      if (errorMessage.includes("[RATE_LIMIT]")) {
        setShowLimitDialog(true);
        finishProcess(processId, "ERROR", "โควต้า AI เต็มชั่วคราว กรุณารอ 1 นาที");
      } else {
        finishProcess(processId, "ERROR", cleanMessage);
        toast.error(cleanMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="gap-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20 h-12 px-6"
        >
          <Sparkles className="h-4 w-4" />
          สร้างบทความด้วย AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <DialogTitle className="text-xl">
              AI Blog Post Generator
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-500">
            ระบุรายละเอียดเพื่อให้ AI ช่วยเขียนบทความ SEO คุณภาพสูงแบบเจาะลึก
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Main Topic Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="keyword"
                className="text-slate-700 font-medium flex items-center gap-2"
              >
                <Target className="h-4 w-4 text-violet-500" />
                Focus Keyword (คีย์เวิร์ดหลัก)
              </Label>
              <Input
                id="keyword"
                placeholder="เช่น วิธีเลือกคอนโดมือสอง, การลงทุนอสังหาฯ 2026"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-11 border-slate-200 focus:ring-violet-500 focus:border-violet-500 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="audience"
                className="text-slate-700 font-medium flex items-center gap-2"
              >
                <Type className="h-4 w-4 text-violet-500" />
                Target Audience (กลุ่มเป้าหมาย)
              </Label>

              <Textarea
                id="audience"
                placeholder="เช่น วัยทำงานกู้ซื้อบ้านหลังแรก, นักลงทุนคอนโดปล่อยเช่า"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="min-h-[80px] border-slate-200 focus:ring-violet-500 focus:border-violet-500 text-base resize-none"
              />
            </div>
          </div>

          {/* Style & Length Section (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="tone"
                className="text-slate-700 font-medium flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4 text-violet-500" />
                Tone of Voice (โทนภาษา)
              </Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-11 border-slate-200 focus:ring-violet-500">
                  <SelectValue placeholder="เลือกโทนภาษา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">
                    Professional (มืออาชีพ)
                  </SelectItem>
                  <SelectItem value="Conversational">
                    Conversational (เป็นกันเอง)
                  </SelectItem>
                  <SelectItem value="Persuasive">
                    Persuasive (โน้มน้าวใจ)
                  </SelectItem>
                  <SelectItem value="Educational">
                    Educational (เน้นให้ความรู้)
                  </SelectItem>
                  <SelectItem value="Luxury">
                    Luxury (หรูหราพรีเมียม)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="length"
                className="text-slate-700 font-medium flex items-center gap-2"
              >
                <AlignJustify className="h-4 w-4 text-violet-500" />
                Article Length (ความยาวบทความ)
              </Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="h-11 border-slate-200 focus:ring-violet-500">
                  <SelectValue placeholder="เลือกความยาว" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short">
                    Short (สั้นกระชับ ~800 คำ)
                  </SelectItem>
                  <SelectItem value="Medium">
                    Medium (มาตรฐาน ~1,500 คำ)
                  </SelectItem>
                  <SelectItem value="Long">
                    Long (เจาะลึกพิเศษ 2,500+ คำ)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Option */}
          <div
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-200 group cursor-pointer"
            onClick={() => setIncludeImage(!includeImage)}
          >
            <div className="space-y-1">
              <Label className="text-base font-semibold text-slate-900 cursor-pointer">
                สร้างรูปภาพหน้าปกอัตโนมัติ
              </Label>
              <p className="text-sm text-slate-500">
                ใช้ AI สร้างรูปภาพหน้าปก และแทรกรูปภาพประกอบเนื้อหา (3-4 รูป)
              </p>
            </div>
            <Switch
              checked={includeImage}
              onCheckedChange={setIncludeImage}
              className="data-[state=checked]:bg-violet-600"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !keyword.trim()}
            className="w-full h-12 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-md font-bold shadow-lg shadow-violet-500/25"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "กำลังสร้างบทความฉบับเต็ม..." : "เริ่มสร้างบทความ SEO"}
          </Button>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 italic">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700/80">
              * การสร้างบทความยาวพิเศษ (2,000+ คำ) อาจใช้เวลาประมาณ 1-2 นาที
              กรุณาเปิดหน้าจอนี้ทิ้งไว้จนกว่าจะเสร็จสมบูรณ์ครับ
            </p>
          </div>

          <AiUsageMonitor />
        </div>
      </DialogContent>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md border-amber-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <MonitorX className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-lg text-amber-950">
                โควต้า AI เต็มชั่วคราว
              </DialogTitle>
            </div>
            <DialogDescription className="text-amber-900/80">
              เพื่อประสิทธิภาพสูงสุด ระบบมีการจำกัดความเร็วในการใช้งาน (Rate
              Limit) ป้องกันการใช้งานที่หนาแน่นเกินไป
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm space-y-3">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                ไม่ต้องตกใจ! ระบบจะรีเซ็ตโควต้าให้ทุกๆ{" "}
                <span className="font-bold">1 นาที</span>
              </p>
            </div>
            <p className="text-amber-700/70 pl-6">
              กรุณารอสักครู่ (ประมาณ 30-60 วินาที) แล้วลองกดสร้างใหม่นะครับ
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
              onClick={() => setShowLimitDialog(false)}
            >
              ตกลง, รอสักครู่
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
