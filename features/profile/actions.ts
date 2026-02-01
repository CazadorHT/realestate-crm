"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

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

export async function updateProfileAction(
  formData: FormData,
): Promise<UpdateProfileResult> {
  try {
    const ctx = await requireAuthContext();

    const full_name = formData.get("full_name") as string;
    const phone = formData.get("phone") as string | null;

    if (!full_name || full_name.trim().length === 0) {
      return { success: false, message: "กรุณากรอกชื่อ" };
    }

    const updateData: {
      full_name: string;
      phone?: string | null;
      line_id?: string | null;
      facebook_url?: string | null;
      whatsapp_id?: string | null;
      wechat_id?: string | null;
    } = {
      full_name: full_name.trim(),
    };

    if (phone) {
      updateData.phone = phone.trim();
    }

    // Social Media Fields
    const line_id = formData.get("line_id") as string | null;
    const facebook_url = formData.get("facebook_url") as string | null;
    const whatsapp_id = formData.get("whatsapp_id") as string | null;
    const wechat_id = formData.get("wechat_id") as string | null;

    if (line_id !== null) updateData.line_id = line_id.trim();
    if (facebook_url !== null) updateData.facebook_url = facebook_url.trim();
    if (whatsapp_id !== null) updateData.whatsapp_id = whatsapp_id.trim();
    if (wechat_id !== null) updateData.wechat_id = wechat_id.trim();

    const { error } = await ctx.supabase
      .from("profiles")
      .update(updateData)
      .eq("id", ctx.user.id);

    if (error) {
      console.error("Profile update error:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
    }

    await logAudit(ctx, {
      action: "profile.update",
      entity: "profiles",
      entityId: ctx.user.id,
      metadata: updateData,
    });

    revalidatePath("/protected/profile");
    revalidatePath("/protected");

    return { success: true };
  } catch (err) {
    return { success: false, message: "Unauthorized" };
  }
}

/**
 * อัปโหลดรูปโปรไฟล์
 */
export async function uploadAvatarAction(
  formData: FormData,
): Promise<UploadAvatarResult> {
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("ไม่พบไฟล์รูปภาพ");
  }

  const ctx = await requireAuthContext();

  // 1. ดึงข้อมูลโปรไฟล์เพื่อหารูปเก่า
  const { data: currentProfile } = await ctx.supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", ctx.user.id)
    .single();

  if (currentProfile?.avatar_url) {
    try {
      // พยายามดึง path ของไฟล์จาก URL
      // รูปแบบ URL: .../storage/v1/object/public/property-images/user-profiles/[path]
      const urlParts = currentProfile.avatar_url.split("/property-images/");
      if (urlParts.length > 1) {
        const oldStoragePath = urlParts[urlParts.length - 1];
        if (oldStoragePath) {
          // ลบไฟล์เก่าออกจาก Storage (ใช้ client ของ user จะเช็คสิทธิ์ตาม RLS ของ Storage)
          await ctx.supabase.storage
            .from("property-images")
            .remove([oldStoragePath]);
        }
      }
    } catch (removeError) {
      console.error("Error removing old avatar:", removeError);
      // ไม่ต้อง throw error เพราะต้องการให้อัปโหลดใหม่ต่อได้
    }
  }

  // 2. เตรียมไฟล์ใหม่
  const originalName = file.name || "avatar.jpg";
  const fileNameParts = originalName.split(".");
  const ext =
    fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() : "jpg";

  // ใช้ UUID เพื่อความ unique และป้องกันการเดาชื่อไฟล์
  const fileName = `${ctx.user.id}_${randomUUID()}.${ext || "jpg"}`;
  const filePath = `user-profiles/${fileName}`; // เก็บไว้ในโฟลเดอร์ user-profiles ภายใน bucket property-images

  // 3. อัปโหลดรูปใหม่ (ใช้ client ของ user ปกติ - RLS จะทำงาน)
  const { error: uploadError } = await ctx.supabase.storage
    .from("property-images")
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Avatar upload error details:", uploadError);
    // แจ้ง Error ละเอียดขึ้นใน Console ของ Server
    throw new Error(`อัปโหลดไม่สำเร็จ: ${uploadError.message}`);
  }

  // 4. สร้าง public URL
  const {
    data: { publicUrl },
  } = ctx.supabase.storage.from("property-images").getPublicUrl(filePath);

  // 5. อัปเดต avatar_url ในฐานข้อมูล (ใช้ client ปกติเพื่อรักษา session)
  const { error: updateError } = await ctx.supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", ctx.user.id);

  if (updateError) {
    console.error("Avatar URL update error:", updateError);
    throw new Error("บันทึกข้อมูลรูปภาพไม่สำเร็จ");
  }

  await logAudit(ctx, {
    action: "profile.avatar.upload",
    entity: "profiles",
    entityId: ctx.user.id,
    metadata: { filePath, publicUrl },
  });

  revalidatePath("/protected/profile");
  revalidatePath("/protected");

  return { path: filePath, publicUrl };
}

/**
 * Update Notification Settings
 */
export async function updateNotificationSettings(
  settings: Record<string, boolean>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const ctx = await requireAuthContext();

    // Validate input (basic check)
    if (!settings || typeof settings !== "object") {
      throw new Error("Invalid settings format");
    }

    const { error } = await ctx.supabase
      .from("profiles")
      .update({ notification_preferences: settings })
      .eq("id", ctx.user.id);

    if (error) {
      console.error("Error updating notification settings:", error);
      return { success: false, message: "Failed to update settings" };
    }

    /* 
    // Optional: Log Audit if needed, but might be too noisy for toggles
    await logAudit(ctx, {
      action: "profile.notification.update",
      entity: "profiles",
      entityId: ctx.user.id,
      metadata: settings,
    });
    */

    revalidatePath("/protected/profile");
    return { success: true };
  } catch (error) {
    console.error("updateNotificationSettings error:", error);
    return { success: false, message: "Unauthorized or Error" };
  }
}
