import "dotenv/config";
import { createAdminClient } from "../lib/supabase/admin";

const templates = [
  {
    key: "DEPOSIT",
    label: "แจ้งฝากทรัพย์ (Deposit)",
    is_active: true,
    config: { headerColor: "#0D47A1", headerText: "ฝากทรัพย์ใหม่ (Deposit)" },
  },
  {
    key: "INQUIRY",
    label: "ติดต่อสนใจทรัพย์ (Inquiry)",
    is_active: true,
    config: { headerColor: "#2E7D32", headerText: "สนใจทรัพย์ / สอบถาม" },
  },
  {
    key: "CONTACT",
    label: "ติดต่อสอบถามทั่วไป (Contact)",
    is_active: true,
    config: {
      headerColor: "#7B1FA2",
      headerText: "ติดต่อผ่านเว็บไซต์ (Contact)",
    },
  },
  {
    key: "SIGNUP",
    label: "สมัครสมาชิกใหม่ (Signup)",
    is_active: true,
    config: { headerColor: "#F57C00", headerText: "สมาชิกใหม่ (New User)" },
  },
  {
    key: "LOGIN",
    label: "เข้าสู่ระบบ (Login)",
    is_active: true,
    config: { headerColor: "#1E88E5", headerText: "🔓 เข้าสู่ระบบ (Login)" },
  },
  {
    key: "DEAL_SOLO",
    label: "แจ้งปิดดีล ขายแล้ว (Sold)",
    is_active: true,
    config: {
      headerColor: "#2E7D32",
      headerText: "🎊 💰 ปิดดีลเรียบร้อย! (ขายแล้ว)",
    },
  },
  {
    key: "DEAL_RENT",
    label: "แจ้งปิดดีล เช่าแล้ว (Rented)",
    is_active: true,
    config: {
      headerColor: "#1976D2",
      headerText: "🎊 📝 ปิดดีลเรียบร้อย! (เช่าแล้ว)",
    },
  },
  {
    key: "PRICE_DROP",
    label: "แจ้งลดราคาทรัพย์ (Price Drop)",
    is_active: true,
    config: { headerColor: "#E53935", headerText: "📉 ลดราคาพิเศษ!" },
  },
];

async function seed() {
  const supabase = createAdminClient();
  console.log("Seeding LINE templates...");

  for (const template of templates) {
    const { error } = await supabase.from("line_templates").upsert(template, {
      onConflict: "key",
    });

    if (error) {
      console.error(`Error upserting ${template.key}:`, error);
    } else {
      console.log(`Successfully upserted ${template.key}`);
    }
  }
}

seed();
