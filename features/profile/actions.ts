"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export type UpdateProfileResult = {
  success: boolean;
  message?: string;
};

export type UploadAvatarResult = {
  path: string;
  publicUrl: string;
};

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้
 */

export async function updateProfileAction(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, message: "ไม่พบข้อมูลผู้ใช้" };
  }

  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string | null;
  
  if (!full_name || full_name.trim().length === 0) {
    return { success: false, message: "กรุณากรอกชื่อ" };
  }

  const updateData: { full_name: string; phone?: string | null } = {
    full_name: full_name.trim(),
  };

  if (phone) {
    updateData.phone = phone.trim();
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
  }

  revalidatePath("/protected/profile");
  revalidatePath("/protected");
  
  return { success: true };
}

/**
 * อัปโหลดรูปโปรไฟล์
 */
export async function uploadAvatarAction(formData: FormData): Promise<UploadAvatarResult> {
  const file = formData.get("file") as File | null;
  
  if (!file) {
    throw new Error("ไม่พบไฟล์รูปภาพ");
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error("ไม่พบข้อมูลผู้ใช้");
  }

  // ลบรูปเก่าก่อน (ถ้ามี)
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (currentProfile?.avatar_url) {
    // Extract path from URL if it's a full URL, or use as-is if it's already a path
    const oldPath = currentProfile.avatar_url.includes("avatars/") 
      ? currentProfile.avatar_url.split("avatars/")[1] 
      : currentProfile.avatar_url;
    
    if (oldPath && !oldPath.startsWith("http")) {
      await supabase.storage.from("avatars").remove([`avatars/${oldPath}`]);
    }
  }

  // อัปโหลดรูปใหม่
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}_${randomUUID()}.${ext}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    throw new Error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
  }

  // สร้าง public URL
  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // อัปเดต avatar_url ในฐานข้อมูล
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("Avatar URL update error:", updateError);
    throw new Error("เกิดข้อผิดพลาดในการบันทึก URL รูปภาพ");
  }

  revalidatePath("/protected/profile");
  revalidatePath("/protected");

  return { path: filePath, publicUrl };
}
