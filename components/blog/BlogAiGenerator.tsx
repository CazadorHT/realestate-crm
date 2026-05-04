"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Target,
  Type,
  MessageSquare,
  AlertCircle,
  MonitorX,
  CheckCircle2,
  Share2,
  AlignJustify,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "../ui/responsive-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateBlogPostAction } from "@/features/blog/actions";
import { toast } from "sonner";
import { AiUsageMonitor } from "@/components/ai-monitor/AiUsageMonitor";
import { startProcess, finishProcess } from "@/lib/process-monitor";

import { BlogAiResult } from "@/features/blog/types";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

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
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [generationResult, setGenerationResult] = useState<BlogAiResult | null>(null);

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error("กรุณาระบุ Focus Keyword");
      return;
    }

    // 🏗️ Step 1: Create taskId on client for sync
    const taskId = crypto.randomUUID();

    // 🏗️ Step 2: Start Process Monitor (Global)
    startProcess(`AI Blog Generation: ${keyword}`, {
      id: taskId,
      type: "BLOG_GENERATION",
      payload: { keyword, targetAudience, tone, length }
    });

    setIsLoading(true);
    
    // 📢 NOTIFY START: Tell the main form that AI has started working
    window.dispatchEvent(new CustomEvent("BLOG_AI_GENERATION_START"));

    try {
      const result = await generateBlogPostAction(
        keyword,
        targetAudience,
        tone,
        length,
        "Realistic", // default image style
        taskId
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      if (result.success && result.data) {
        // 🔄 SYNC SUCCESS (Fallback): We got the data directly
        const blogResult = result.data as BlogAiResult;
        
        // 🚀 FORCE UI UPDATE: Tell the monitor we are DONE
        if (taskId) {
          const { dispatchProcessEvent } = await import("@/lib/process-monitor");
          dispatchProcessEvent({
            type: "PROCESS_UPDATED",
            id: taskId,
            status: "SUCCESS",
            message: "สร้างบทความเสร็จสมบูรณ์ (Sync)"
          });
        }

        window.dispatchEvent(new CustomEvent("BLOG_AI_GENERATED_SUCCESS", { detail: blogResult }));
        setGenerationResult(blogResult);
        toast.success(result.message);
      } else if (result.success && result.taskId) {
        // 🚀 ASYNC SUCCESS: We got a taskId, the process monitor is already tracking it
        toast.success(result.message);
        
        // Close the dialog after a short delay since it's now a background task
        setTimeout(() => {
          setIsOpen(false);
          setIsLoading(false);
        }, 1500);
      }

    } catch (error: unknown) {
      console.error("AI Generation Error:", error);
      
      // 📢 NOTIFY ERROR: Stop loading state on the form if it fails
      window.dispatchEvent(new CustomEvent("BLOG_AI_GENERATION_ERROR"));
      
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างบทความ";
      const cleanMessage = errorMessage.replace(/^Error: /, "");

      if (errorMessage.includes("[RATE_LIMIT]")) {
        setShowLimitDialog(true);
      } else {
        toast.error(cleanMessage);
      }
      setIsLoading(false);
    }
  };

  const renderContent = () => (
    <div className="p-6 md:p-8 space-y-8">
      <div className="grid gap-8 py-2">
        {/* Main Topic Section */}
        <div className="grid gap-6">
          <div className="space-y-3">
            <Label
              htmlFor="keyword"
              className="text-slate-900 font-bold text-sm flex items-center gap-2"
            >
              <div className="p-1 bg-violet-100 rounded-md">
                <Target className="h-3.5 w-3.5 text-violet-600" />
              </div>
              Focus Keyword (คีย์เวิร์ดหลัก)
            </Label>
            <Input
              id="keyword"
              placeholder="เช่น วิธีเลือกคอนโดมือสอง, การลงทุนอสังหาฯ 2026"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-14 border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-lg rounded-xl px-5"
            />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="audience"
              className="text-slate-900 font-bold text-sm flex items-center gap-2"
            >
              <div className="p-1 bg-indigo-100 rounded-md">
                <Type className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              Target Audience (กลุ่มเป้าหมาย)
            </Label>

            <Textarea
              id="audience"
              placeholder="เช่น วัยทำงานกู้ซื้อบ้านหลังแรก, นักลงทุนคอนโดปล่อยเช่า"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="min-h-[100px] border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base rounded-xl p-5 resize-none shadow-xs"
            />
          </div>
        </div>

        {/* Style & Length Section (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tone of Voice Selection */}
          <div className="space-y-3">
            <Label className="text-slate-900 font-bold text-sm flex items-center gap-2">
              <div className="p-1 bg-fuchsia-100 rounded-md">
                <MessageSquare className="h-3.5 w-3.5 text-fuchsia-600" />
              </div>
              Tone of Voice (โทนภาษา)
            </Label>
            
            <ResponsiveSelect
              value={tone}
              onValueChange={setTone}
              options={[
                { label: "Professional (มืออาชีพ)", value: "Professional" },
                { label: "Conversational (เป็นกันเอง)", value: "Conversational" },
                { label: "Persuasive (โน้มน้าวใจ)", value: "Persuasive" },
                { label: "Educational (เน้นให้ความรู้)", value: "Educational" },
                { label: "Luxury (หรูหราพรีเมียม)", value: "Luxury" },
              ]}
              placeholder="เลือกโทนภาษา"
            />
          </div>

          {/* Article Length Selection */}
          <div className="space-y-3">
            <Label className="text-slate-900 font-bold text-sm flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded-md">
                <AlignJustify className="h-3.5 w-3.5 text-blue-600" />
              </div>
              Article Length (ความยาวบทความ)
            </Label>
            
            <ResponsiveSelect
              value={length}
              onValueChange={setLength}
              options={[
                { label: "Short (สั้นกระชับ ~800 คำ)", value: "Short" },
                { label: "Medium (มาตรฐาน ~1,500 คำ)", value: "Medium" },
                { label: "Long (เจาะลึกพิเศษ 2,500+ คำ)", value: "Long" },
              ]}
              placeholder="เลือกความยาว"
            />
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="space-y-4 pt-4">
        {generationResult ? (
          <div className="space-y-4 animate-in zoom-in-95 duration-500">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                <span className="text-xl font-bold text-emerald-600">{generationResult.seo_score || 95}</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  SEO Content Analysis
                </h4>
                <p className="text-sm text-emerald-800/80 leading-relaxed italic">
                  "{generationResult.seo_feedback || "บทความมีคุณภาพสูงและพร้อมสำหรับการเผยแพร่"}"
                </p>
              </div>
            </div>

            {generationResult.social_snippets && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <Label className="text-slate-500 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest px-1">
                  <Share2 className="h-3 w-3 text-violet-500" />
                  Social Media Snippets (Draft)
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="group relative bg-white border border-slate-200 rounded-xl p-4 text-[12px] text-slate-600 leading-relaxed shadow-xs hover:border-violet-200 transition-all">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-violet-50 text-violet-600 text-[9px] border-violet-100">FB/IG</Badge>
                    </div>
                    <p className="line-clamp-4 italic">
                      {generationResult.social_snippets.facebook}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={() => {
                onGenerated(generationResult);
                setIsOpen(false);
              }}
              className="w-full h-14 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-lg shadow-xl shadow-emerald-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              นำเข้าข้อมูลสู่บทความ ✨
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !keyword.trim()}
              className="w-full h-16 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-lg font-black shadow-xl shadow-violet-500/25 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98] group"
            >
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    <span>กำลังรังสรรค์บทความ...</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-80 mt-1">
                    (คุณสามารถปิดหน้านี้ไปทำงานอื่นได้เลย ระบบจะรันเบื้องหลังให้ครับ)
                  </span>
                </div>
              ) : (
                <>
                  <Sparkles className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                  <span>เริ่มสร้างบทความ SEO ทันที</span>
                </>
              )}
            </Button>

            <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">Pro Tip</p>
                <p className="text-[11px] text-amber-700/80 leading-normal">
                  การสร้างบทความแบบเจาะลึก ใช้เวลาประมาณ 1-2 นาที คุณสามารถปิดหน้านี้ไปทำงานอื่นได้เลย ระบบจะแจ้งเตือนเมื่อเสร็จครับ
                </p>
              </div>
            </div>
          </>
        )}

        <div className="pt-2">
          <AiUsageMonitor />
        </div>
      </div>
    </div>
  );

  const headerContent = (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="absolute -inset-1 bg-linear-to-r from-violet-600 to-indigo-600 rounded-xl blur-sm opacity-25" />
        <div className="relative p-3 bg-linear-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/20">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="text-left">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          AI Blog Architect <span className="text-violet-600 text-sm align-top ml-1 font-black">v3.0</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          สร้างคอนเทนต์ระดับพรีเมียมด้วย AI ยุคใหม่
        </p>
      </div>
    </div>
  );

  const trigger = (
    <Button
      type="button"
      className="gap-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20 h-12 px-6"
    >
      <Sparkles className="h-4 w-4" />
      สร้างบทความด้วย AI
    </Button>
  );

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setGenerationResult(null);
      }}
      trigger={trigger}
      title={headerContent}
      className="sm:max-w-[750px] p-0"
    >
      {renderContent()}

      {/* Internal Rate Limit Dialog */}
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
    </ResponsiveDialog>
  );
}

/**
 * Helper component for responsive selection (Tone, Length)
 */
function ResponsiveSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onValueChange: (val: string) => void; 
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  const trigger = (
    <Button
      type="button"
      variant="outline"
      onClick={() => setOpen(true)}
      className="w-full h-12 justify-between border-slate-200 bg-slate-50/50 hover:bg-white transition-all rounded-xl px-4 font-normal"
    >
      <span className={cn(value ? "text-slate-900" : "text-slate-400")}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <AlignJustify className="h-4 w-4 text-slate-400" />
    </Button>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={placeholder}
      className="sm:max-w-[400px] p-0"
    >
      <div className="grid gap-1 p-2 md:p-4 pb-8 md:pb-4">
        {options.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            className={cn(
              "justify-start h-12 md:h-14 px-4 rounded-xl text-base",
              value === option.value && "bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
            )}
            onClick={() => {
              onValueChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}
            {value === option.value && <CheckCircle2 className="ml-auto h-4 w-4" />}
          </Button>
        ))}
      </div>
    </ResponsiveDialog>
  );
}


