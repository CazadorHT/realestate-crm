import { createClient } from "@/lib/supabase/server";
import { LineTemplateConfig } from "./types";

const DEFAULT_CONFIGS: Record<string, LineTemplateConfig> = {
  DEPOSIT: { headerColor: "#0D47A1", headerText: "ฝากทรัพย์ใหม่ (Deposit)" },
  INQUIRY: { headerColor: "#2E7D32", headerText: "สนใจทรัพย์ / สอบถาม" },
  CONTACT: {
    headerColor: "#7B1FA2",
    headerText: "ติดต่อผ่านเว็บไซต์ (Contact)",
  },
  SIGNUP: { headerColor: "#F57C00", headerText: "สมาชิกใหม่ (New User)" },
  LOGIN: { headerColor: "#1E88E5", headerText: "🔓 เข้าสู่ระบบ (Login)" },
  PRICE_DROP: { headerColor: "#E53935", headerText: "📉 ลดราคาพิเศษ!" },
  DEAL_SOLO: {
    headerColor: "#2E7D32",
    headerText: "🎊 💰 ปิดดีลเรียบร้อย! (ขายแล้ว)",
  },
  DEAL_RENT: {
    headerColor: "#1976D2",
    headerText: "🎊 📝 ปิดดีลเรียบร้อย! (เช่าแล้ว)",
  },
};

export async function getTemplateConfig(
  key: string,
): Promise<{ config: LineTemplateConfig; isActive: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("line_templates")
    .select("config, is_active")
    .eq("key", key)
    .single();

  if (data) {
    return {
      config: data.config as LineTemplateConfig,
      isActive: data.is_active ?? true,
    };
  }

  // Fallback if DB not ready or key missing
  return {
    config: DEFAULT_CONFIGS[key] || {
      headerColor: "#333",
      headerText: "Notification",
    },
    isActive: true,
  };
}
