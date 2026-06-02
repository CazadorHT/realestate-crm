"use client";

import { useEffect, useState } from "react";
import {
  getAiModelConfig,
  updateAiModelConfig,
} from "@/features/ai-settings/actions";
import {
  ALLOWED_MODELS,
  MODEL_INFO_MAP as MODEL_INFO,
  type AiModelChoice,
  type AiModelConfig,
} from "@/features/ai-settings/constants";
import {
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Bot,
  Languages,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export default function AiConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialConfig, setInitialConfig] = useState<AiModelConfig | null>(
    null,
  );
  const [config, setConfig] = useState<AiModelConfig>({
    chatbot_model: "gemini-flash-lite-latest",
    blog_generator_model: "gemini-flash-latest",
    translation_model: "gemini-flash-lite-latest",
    description_model: "gemini-flash-lite-latest",
    lead_model: "gemini-flash-lite-latest",
  });

  useEffect(() => {
    async function load() {
      const data = await getAiModelConfig();
      // Ensure all models in config are actually allowed
      const validatedConfig = { ...data };
      Object.keys(validatedConfig).forEach((key) => {
        const k = key as keyof AiModelConfig;
        if (!MODEL_INFO[validatedConfig[k]]) {
          validatedConfig[k] = "gemini-flash-lite-latest"; // Fallback to safe default
        }
      });
      setConfig(validatedConfig);
      setInitialConfig(validatedConfig);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateAiModelConfig(config);
    if (result.success) {
      toast.success("บันทึกการตั้งค่า AI สำเร็จ");
      setInitialConfig(config); // Update initial config to match current
    } else {
      toast.error("บันทึกไม่สำเร็จ: " + result.message);
    }
    setSaving(false);
  };

  const hasChanged =
    initialConfig && JSON.stringify(config) !== JSON.stringify(initialConfig);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">
            กำลังโหลดการตั้งค่า...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-screen-2xl mx-auto space-y-6 md:space-y-10">
      <SettingsHeader 
        title={<>จัดการโมเดล <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI Infrastructure</span></>}
        description="เลือกโมเดล AI ที่เหมาะสมที่สุดสำหรับแต่ละฟีเจอร์ เพื่อความคุ้มค่าและประสิทธิภาพสูงสุด"
        subPath={[
          { label: "System Control", href: "/protected/settings?tab=ai" },
          { label: "AI Model Config (จัดการโมเดล AI)" }
        ]}
        actions={
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed h-12 px-8 font-bold text-base rounded-2xl transition-all active:scale-95"
            onClick={handleSave}
            disabled={saving || !hasChanged}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            บันทึกการตั้งค่า
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Chatbot Config */}
        <ConfigCard
          icon={<Bot className="w-6 h-6 text-blue-600" />}
          title="AI Chatbot (Customer Inquiries)"
          description="โมเดลสำหรับตอบคำถามลูกค้าหน้าเว็บไซต์และวิเคราะห์ความต้องการเบื้องต้น"
          value={config.chatbot_model}
          onChange={(val) => setConfig({ ...config, chatbot_model: val })}
        />

        {/* Blog Generator Config */}
        <ConfigCard
          icon={<FileText className="w-6 h-6 text-pink-600" />}
          title="Content & Blog Generator"
          description="โมเดลสำหรับสร้างบทความอสังหาริมทรัพย์และเขียนคำบรรยายทรัพย์ให้โดดเด่น"
          value={config.blog_generator_model}
          onChange={(val) =>
            setConfig({ ...config, blog_generator_model: val })
          }
        />

        {/* Translation Config */}
        <ConfigCard
          icon={<Languages className="w-6 h-6 text-emerald-600" />}
          title="Global Translation Fix"
          description="โมเดลสำหรับแปลรายละเอียดทรัพย์เป็นภาษาอังกฤษและภาษาจีน (EN/CN)"
          value={config.translation_model}
          onChange={(val) => setConfig({ ...config, translation_model: val })}
        />

        {/* Description Config */}
        <ConfigCard
          icon={<Zap className="w-6 h-6 text-orange-600" />}
          title="Property Description Generator"
          description="โมเดลสำหรับคิดคำพรรณนาทรัพย์สินให้ดึงดูดใจผู้ซื้อตามข้อมูลทางเทคนิค"
          value={config.description_model}
          onChange={(val) => setConfig({ ...config, description_model: val })}
        />

        {/* Lead Analysis Config */}
        <ConfigCard
          icon={<Sparkles className="w-6 h-6 text-violet-600" />}
          title="Lead Summary Assistant"
          description="โมเดลสำหรับสรุปพฤติกรรมและความต้องการของลูกค้า (Leads) จากประวัติกิจกรรม"
          value={config.lead_model}
          onChange={(val) => setConfig({ ...config, lead_model: val })}
        />
      </div>

      {/* Quota & Troubleshooting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row gap-4">
          <div className="bg-white p-3 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm h-fit w-fit">
            <Info className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">
              เกร็ดความรู้เรื่อง Quota 💡
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-indigo-600">Gemini 3.1 Flash-Lite</strong> เป็นรุ่นที่แนะนำที่สุด
              เพราะโควต้าฟรีให้สูงถึง <span className="font-bold text-emerald-600 underline">500 ครั้ง/วัน</span> (RPD) 
              ในขณะที่รุ่นอื่นให้เพียง 20 ครั้ง/วัน เท่านั้น หากต้องการงานที่ไหลลื่นและประหยัด 
              ควรตั้งค่ารุ่น Flash-Lite เป็นหลักในทุกบริการครับ
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row gap-4 shadow-sm shadow-amber-100">
          <div className="bg-white p-3 rounded-xl md:rounded-2xl border border-amber-100 shadow-sm h-fit w-fit">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-amber-900">
              วิธีเช็คว่า Model ไหน "เต็ม" 🚩
            </h4>
            <p className="text-[13px] md:text-sm text-amber-800 leading-relaxed">
              หากใช้งานแล้วเจอข้อความ <strong>"[RATE_LIMIT] โควต้าเต็ม"</strong>{" "}
              แสดงว่ารุ่นนั้นถึงขีดจำกัดชั่วคราว:
            </p>
            <ul className="text-[11px] md:text-xs text-amber-700 space-y-1.5 ml-4 list-disc font-medium">
              <li>
                ตรวจสอบ <strong>AI Monitor</strong> เพื่อดู Error (Code 429) ย้อนหลัง
              </li>
              <li>ทางแก้: สลับไปใช้ <strong>Flash-Lite</strong> (หากยังไม่ได้ใช้) หรือสลับไปรุ่น 1.5 Flash</li>
              <li>หากเต็มทุกรุ่น: แนะนำให้เพิ่ม <strong>API Key</strong> อีก 1 ชุดในไฟล์ .env ครับ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigCard({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: AiModelChoice;
  onChange: (val: AiModelChoice) => void;
}) {
  const selectedInfo = MODEL_INFO[value] || MODEL_INFO["gemini-flash-lite-latest"];
  const Icon = selectedInfo.icon || Zap;

  return (
    <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden group">
      <CardHeader className="pb-4 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm sm:group-hover:scale-110 transition-transform duration-300 shrink-0">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl font-medium text-slate-900 leading-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2 sm:line-clamp-none">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5 md:p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {ALLOWED_MODELS.map((model) => {
            const isSelected = model.id === value;
            const ModelIcon = model.icon;
            const isRecommended = model.id === "gemini-flash-lite-latest";

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onChange(model.id as AiModelChoice)}
                className={cn(
                  "relative flex flex-col items-start p-4 md:p-5 rounded-2xl border-2 text-left transition-all duration-300 group",
                  isSelected
                    ? "border-indigo-600 bg-indigo-500 shadow-md ring-4 ring-indigo-500/10  "
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm",
                )}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className="absolute -top-2.5 -right-1 z-10">
                    <Badge className="bg-emerald-500 text-white border-none text-[10px] md:text-[11px] font-medium uppercase tracking-tight px-1.5 py-0.5 shadow-sm">
                      Recommended
                    </Badge>
                  </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className={cn("w-5 h-5",isSelected ? "text-white" : "text-indigo-600")} />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "p-2 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110",
                      model.color.split(" ")[0].replace("text-", "bg-") + "/10",
                    )}
                  >
                    <ModelIcon className={cn("w-5 h-5", model.color)} />
                  </div>
                  <span className={cn("font-bold text-slate-900 text-sm md:text-base leading-tight",isSelected ? "text-white" : "text-slate-900")}>
                    {model.label}
                  </span>
                </div>

                <p className={cn("text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed line-clamp-2",isSelected ? "text-white" : "text-slate-500")}>
                  {model.description}
                </p>

                {/* Quota Info Tooltip */}
                <div className="absolute bottom-4 right-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "p-1 rounded-full transition-colors",
                          isSelected ? "hover:bg-white/20" : "hover:bg-slate-100"
                        )}>
                          <HelpCircle className={cn("w-3.5 h-3.5", isSelected ? "text-white/70" : "text-slate-400")} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px] p-3 bg-slate-900 text-white border-slate-800 shadow-xl">
                        <div className="space-y-2">
                          <p className="font-bold text-xs border-b border-white/10 pb-1">รายละเอียดโควต้า & ราคา</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                            <span className="text-white/60">ราคา (Input):</span>
                            <span>{model.id.includes('lite') ? '$0.25' : model.id.includes('pro') ? '$1.25' : '$0.30'} / 1M Tokens</span>
                            <span className="text-white/60">โควต้าฟรี (RPD):</span>
                            <span className="text-emerald-400 font-bold">{model.id === 'gemini-flash-lite-latest' ? '500' : '20-50'} ครั้ง/วัน</span>
                            <span className="text-white/60">ความเร็ว (RPM):</span>
                            <span>{model.id === 'gemini-flash-lite-latest' ? '15' : '2-5'} ครั้ง/นาที</span>
                          </div>
                          <p className="text-[9px] text-white/40 italic pt-1">* ข้อมูลโดยประมาณจากหน้า Rate Limit</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Hover/Active states indicator */}
                {!isSelected && (
                  <div className="mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                      Select Model
                    </span>
                    <ChevronRight className="w-3 h-3 text-indigo-600" />
                  </div>
                )}
                {isSelected && (
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-white tracking-wider">
                      Active Now
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
