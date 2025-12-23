// lib/supabase/getCurrentProfile.ts
import { createClient } from "@/lib/supabase/server";

import { type UserRole } from "@/lib/auth-shared";

export type Profile = {
  id: string;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  full_name: string | null;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  // 1. ดึงข้อมูล User จาก Supabase Auth (System Table)
  // ส่วนนี้เก็บข้อมูล Login พื้นฐาน เช่น ID, Email และ Metadata จาก Provider (Google, etc.)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("auth.getUser error", userError);
    return null;
  }

  // 2. ดึงข้อมูลเพิ่มเติมจากตาราง 'profiles' (Custom Table)
  // ตารางนี้เราสร้างเองเพื่อเก็บข้อมูลที่แก้ได้ เช่น ชื่อที่เปลี่ยนใหม่, รูปโปรไฟล์ที่อัพโหลดเอง
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, avatar_url, full_name")
    .eq("id", user.id)
    .single();

  // Fallback Logic: กรณีไม่มีข้อมูลในตาราง profiles (เช่น เพิ่งสมัครใหม่)
  // ให้ใช้ข้อมูลจาก Auth Metadata (Google/Email) มาแสดงแทน เพื่อให้หน้าเว็บไม่ว่างเปล่า
  if (profileError || !profile) {
    console.warn("Profile not found in DB, using auth metadata", profileError);

    return {
      id: user.id,
      email: user.email ?? null,
      role: user.user_metadata?.role ?? "USER", // Default to USER for new signups
      avatar_url: user.user_metadata?.avatar_url ?? null, // รูปจาก Google
      full_name:
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? null, // ชื่อจาก Google
    };
  }

  // Merge Logic: ถ้ามี profiles แต่บางค่าเป็น Null ให้ลองดึงจาก Auth มาเติมให้เต็ม
  const dbProfile = profile as unknown as Profile;

  return {
    ...dbProfile,
    email: dbProfile.email || user.email || null,
    full_name:
      dbProfile.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      null,
    avatar_url: dbProfile.avatar_url || user.user_metadata?.avatar_url || null,
  };
}
