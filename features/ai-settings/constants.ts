import { Zap, Sparkles, Cpu, Bot } from "lucide-react";

/**
 * Registry of supported AI models.
 * Add new models here to make them available across the entire system.
 */
export const ALLOWED_MODELS = [
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "สมดุลที่สุด เร็ว แรง และโควต้าเยอะ (ฟรีและคุ้ม)",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Zap,
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash-Lite",
    description: "เน้นความเร็วสูงสุด สำหรับงานแชทตอบโต้ทันใจ",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Sparkles,
  },
  {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    description: "เสถียรมาก รองรับงานทั่วไปได้ดีเยี่ยม",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Cpu,
  },
  {
    id: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    description: "ฉลาดที่สุด สำหรับงานที่ต้องการความซับซ้อนสูง (สรุปสัญญา)",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Bot,
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
  chatbot_model: "gemini-2.0-flash",
  blog_generator_model: "gemini-2.0-flash",
  translation_model: "gemini-1.5-flash",
  description_model: "gemini-2.0-flash",
  lead_model: "gemini-2.0-flash",
};
