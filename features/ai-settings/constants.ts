import { Zap, Sparkles, Cpu, Bot } from "lucide-react";

/**
 * Registry of supported AI models.
 * Add new models here to make them available across the entire system.
 */
export const ALLOWED_MODELS = [
  {
    id: "gemini-flash-lite-latest",
    label: "Gemini 3.1 Flash-Lite (แนะนำสุดๆ)",
    label_en: "Gemini 3.1 Flash-Lite (Highly Recommended)",
    description: "รุ่นที่ประหยัดและคุ้มค่าที่สุดในตอนนี้ (Stable) เหมาะกับงานแปลและสรุปข้อมูลปริมาณมาก",
    description_en: "Most cost-effective & fastest model (Stable). Perfect for large-scale translation and summaries.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Zap,
  },
  {
    id: "gemini-flash-latest",
    label: "Gemini 3 Flash",
    label_en: "Gemini 3 Flash",
    description: "รุ่นที่สมดุลที่สุด เร็วและฉลาดมาก เหมาะกับงานเขียนคำบรรยายทรัพย์และแชทบอท",
    description_en: "Most balanced model. Highly intelligent and fast, ideal for property descriptions & chatbots.",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Sparkles,
  },
  {
    id: "gemini-pro-latest",
    label: "Gemini 3.1 Pro",
    label_en: "Gemini 3.1 Pro",
    description: "รุ่นที่ฉลาดที่สุดในโลก (Preview) สำหรับงานเขียน Blog ยาวๆ หรืองานวิจัยข้อมูลที่ซับซ้อน",
    description_en: "State-of-the-art intelligence (Preview). Ideal for long-form blog articles and deep analysis.",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Bot,
  },
  {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash (Legacy)",
    label_en: "Gemini 1.5 Flash (Legacy)",
    description: "รุ่นเก่ามาตรฐานเดิมที่ยังคงใช้งานได้ดี (แนะนำให้เปลี่ยนเป็นรุ่น 3.1 เพื่อความคุ้มค่า)",
    description_en: "Standard legacy model. Works reliably, but upgrading to 3.1 is recommended for speed and value.",
    color: "bg-slate-50 text-slate-700 border-slate-200",
    icon: Cpu,
  },
] as const;

export type AiModelChoice = (typeof ALLOWED_MODELS)[number]["id"];

export const MODEL_INFO_MAP = ALLOWED_MODELS.reduce(
  (acc, model) => {
    acc[model.id] = model;
    return acc;
  },
  {} as Record<
    (typeof ALLOWED_MODELS)[number]["id"],
    (typeof ALLOWED_MODELS)[number]
  >,
);

export type AiModelConfig = {
  chatbot_model: AiModelChoice;
  blog_generator_model: AiModelChoice;
  translation_model: AiModelChoice;
  description_model: AiModelChoice;
  lead_model: AiModelChoice;
};

export const DEFAULT_CONFIG: AiModelConfig = {
  chatbot_model: "gemini-flash-lite-latest",
  blog_generator_model: "gemini-flash-lite-latest",
  translation_model: "gemini-flash-lite-latest",
  description_model: "gemini-flash-lite-latest",
  lead_model: "gemini-flash-lite-latest",
};
