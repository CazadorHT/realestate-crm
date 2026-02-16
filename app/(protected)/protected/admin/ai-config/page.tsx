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
  Brain,
  MessageSquare,
  Globe,
  FileText,
  User,
  Layout,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Cpu,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AiConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialConfig, setInitialConfig] = useState<AiModelConfig | null>(
    null,
  );
  const [config, setConfig] = useState<AiModelConfig>({
    chatbot_model: "gemini-2.0-flash",
    blog_generator_model: "gemini-2.0-flash",
    translation_model: "gemini-1.5-flash",
    description_model: "gemini-2.0-flash",
    lead_model: "gemini-2.0-flash",
  });

  useEffect(() => {
    async function load() {
      const data = await getAiModelConfig();
      // Ensure all models in config are actually allowed
      const validatedConfig = { ...data };
      Object.keys(validatedConfig).forEach((key) => {
        const k = key as keyof AiModelConfig;
        if (!MODEL_INFO[validatedConfig[k]]) {
          validatedConfig[k] = "gemini-2.0-flash"; // Fallback to safe default
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
    <div className="p-8 max-w-screen-2xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>AI Infrastructure</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            AI Model Configuration
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            เลือกโมเดล AI ที่เหมาะสมที่สุดสำหรับแต่ละฟีเจอร์
            เพื่อความคุ้มค่าและประสิทธิภาพสูงสุด
          </p>
        </div>
        <Button
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={saving || !hasChanged}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          บันทึกการตั้งค่า
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex gap-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm h-fit">
            <Info className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">
              เกร็ดความรู้เรื่อง Quota 💡
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Gemini 2.0 Flash เป็นรุ่นที่แนะนำที่สุดในขณะนี้
              เพราะให้ประสิทธิภาพสูงในขณะที่โควต้าการใช้งานฟรีมีให้มากกว่ารุ่นอื่นๆ
              หากระบบมีการใช้งานหนัก แนะนำให้ใช้ Flash หรือ Flash-Lite
              เป็นหลักครับ
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex gap-4 shadow-sm shadow-amber-100">
          <div className="bg-white p-3 rounded-2xl border border-amber-100 shadow-sm h-fit">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-amber-900">
              วิธีเช็คว่า Model ไหน "เต็ม" 🚩
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              หากใช้งานแล้วเจอข้อความ <strong>"[RATE_LIMIT] โควต้าเต็ม"</strong>{" "}
              แสดงว่ารุ่นนั้นถึงขีดจำกัดชั่วคราว:
            </p>
            <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
              <li>
                ใช้ <strong>AI Monitor</strong> เพื่อดูประวัติ Error ย้อนหลัง
              </li>
              <li>ทางแก้: สลับไปใช้ Model รุ่นอื่น (เช่น จาก 1.5 เป็น 2.0)</li>
              <li>สลับรุ่นแล้วระบบจะกลับมาใช้งานได้ทันทีครับ</li>
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
  const selectedInfo = MODEL_INFO[value] || MODEL_INFO["gemini-2.0-flash"];
  const Icon = selectedInfo.icon || Zap;

  return (
    <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {title}
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wider">
              <span>Current Model</span>
              <ChevronRight className="w-4 h-4" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${selectedInfo.color}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {selectedInfo.label}
              </Badge>
              <span className="text-slate-400 text-sm italic">
                "{selectedInfo.description}"
              </span>
            </div>
          </div>

          <div className="w-full md:w-80 ">
            <Select
              value={value}
              onValueChange={(val) => onChange(val as AiModelChoice)}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white hover:border-indigo-300 focus:ring-indigo-500 shadow-sm">
                <SelectValue placeholder="เลือกโมเดล" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                {(Object.keys(MODEL_INFO) as AiModelChoice[]).map((key) => {
                  const info = MODEL_INFO[key];
                  const SelectIcon = info.icon;
                  return (
                    <SelectItem
                      key={key}
                      value={key}
                      className="py-3 px-4 focus:bg-indigo-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <SelectIcon className="w-4 h-4 text-slate-400" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {info.label}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight">
                            {info.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
