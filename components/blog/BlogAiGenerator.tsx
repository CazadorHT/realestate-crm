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
import { generateBlogPostAction } from "@/features/blog/actions";
import { toast } from "sonner";

interface BlogAiGeneratorProps {
  onGenerated: (data: any) => void;
}

export function BlogAiGenerator({ onGenerated }: BlogAiGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [includeImage, setIncludeImage] = useState(false);

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error("กรุณาระบุ Focus Keyword");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(
      "AI กำลังสร้างบทความคุณภาพสูง (2,000+ คำ)... กรุณารอสักครู่ครับ",
      {
        duration: 60000,
      },
    );

    try {
      const result = await generateBlogPostAction(
        keyword,
        targetAudience,
        tone,
        includeImage,
      );

      onGenerated(result);

      if (includeImage && !result.cover_image) {
        toast.warning(
          "สร้างบทความสำเร็จ 📝 แต่ระบบรูปภาพขัดข้องชั่วคราว (Pollinations API 502)",
          {
            id: toastId,
            duration: 5000,
          },
        );
      } else {
        toast.success("สร้างบทความด้วย AI สำเร็จแล้ว! ✨", { id: toastId });
      }

      setIsOpen(false);
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างบทความ", { id: toastId });
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
      <DialogContent className="sm:max-w-[500px] border-slate-200">
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
          <div className="space-y-2">
            <Label
              htmlFor="keyword"
              className="text-slate-700 font-medium flex items-center gap-2"
            >
              <Target className="h-4 w-4 text-slate-400" />
              Focus Keyword (คีย์เวิร์ดหลัก)
            </Label>
            <Input
              id="keyword"
              placeholder="เช่น วิธีเลือกคอนโดมือสอง, การลงทุนอสังหาฯ 2024"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-11 border-slate-200 focus:ring-violet-500"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="audience"
              className="text-slate-700 font-medium flex items-center gap-2"
            >
              <Type className="h-4 w-4 text-slate-400" />
              Target Audience (กลุ่มเป้าหมาย)
            </Label>

            <Textarea
              id="audience"
              placeholder="เช่น วัยทำงานกู้ซื้อบ้านหลังแรก, นักลงทุนคอนโดปล่อยเช่า"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="min-h-[80px] border-slate-200 focus:ring-violet-500"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="tone"
              className="text-slate-700 font-medium flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4 text-slate-400" />
              Tone of Voice (โทนภาษา)
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-11 border-slate-200">
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
                <SelectItem value="Luxury">Luxury (หรูหราพรีเมียม)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-0.5">
              <Label className="text-base font-medium text-slate-900">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
