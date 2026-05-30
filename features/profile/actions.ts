"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";
import { Database } from "@/lib/database.types.generated";

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
    const nickname = formData.get("nickname") as string | null;
    const phone = formData.get("phone") as string | null;

    if (!full_name || full_name.trim().length === 0) {
      return { success: false, message: "กรุณากรอกชื่อ" };
    }

    const updateData: Database["public"]["Tables"]["profiles"]["Update"] & {
      wechat_user_id?: string | null;
      whatsapp_user_id?: string | null;
    } = {
      full_name: full_name.trim(),
    };

    if (phone) {
      updateData.phone = phone.trim();
    }

    if (nickname !== null) {
      updateData.nickname = nickname.trim();
    }

    // Social Media & Tax Fields
    const line_id = formData.get("line_id") as string | null;
    const line_user_id = formData.get("line_user_id") as string | null;
    const facebook_url = formData.get("facebook_url") as string | null;
    const whatsapp_id = formData.get("whatsapp_id") as string | null;
    const wechat_id = formData.get("wechat_id") as string | null;
    const tax_id = formData.get("tax_id") as string | null;
    const tax_address = formData.get("tax_address") as string | null;
    const telegram_id = formData.get("telegram_id") as string | null;
    const wechat_user_id = formData.get("wechat_user_id") as string | null;
    const whatsapp_user_id = formData.get("whatsapp_user_id") as string | null;
    const bank_code = formData.get("bank_code") as string | null;
    const other_bank_name = formData.get("other_bank_name") as string | null;
    const bank_account_no = formData.get("bank_account_no") as string | null;
    const bank_account_name = formData.get("bank_account_name") as string | null;

    if (line_id !== null) updateData.line_id = line_id.trim();
    if (line_user_id !== null) updateData.line_user_id = line_user_id.trim();
    if (facebook_url !== null) updateData.facebook_url = facebook_url.trim();
    if (whatsapp_id !== null) updateData.whatsapp_id = whatsapp_id.trim();
    if (wechat_id !== null) updateData.wechat_id = wechat_id.trim();

    // 🛡️ Sensitive Tax Information
    if (tax_id !== null) updateData.tax_id = tax_id.trim();
    if (tax_address !== null) updateData.tax_address = tax_address.trim();

    // 🏦 Fintech Bank Information
    if (bank_code !== null) updateData.bank_code = bank_code.trim();
    if (other_bank_name !== null) updateData.other_bank_name = other_bank_name.trim();
    if (bank_account_no !== null) updateData.bank_account_no = bank_account_no.trim();
    if (bank_account_name !== null) updateData.bank_account_name = bank_account_name.trim();

    // 📟 Telegram & Social Back-office (Hardened Normalization)
    const normalize = (val: string | null) => (val?.trim().length ? val.trim() : null);

    if (telegram_id !== null) updateData.telegram_id = normalize(telegram_id);
    if (wechat_user_id !== null) updateData.wechat_user_id = normalize(wechat_user_id);
    if (whatsapp_user_id !== null) updateData.whatsapp_user_id = normalize(whatsapp_user_id);

    // 1. Update Profiles table (UI & Business Details)
    const { error: profileError } = await ctx.supabase
      .from("profiles")
      .update(updateData as Database["public"]["Tables"]["profiles"]["Update"])
      .eq("id", ctx.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return {
        success: false,
        message: mapDbError(profileError) || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลส่วนตัว",
      };
    }

    // 2. Sync to Identities table (System Master Record)
    // We sync display_name and phone for system-wide consistency
    const identityUpdate: Database["public"]["Tables"]["identities_v3"]["Update"] & {
      wechat_user_id?: string | null;
      whatsapp_user_id?: string | null;
    } = {
      display_name: full_name.trim(),
      phone: normalize(phone),
      line_id: normalize(line_id),
      wechat_user_id: normalize(wechat_user_id),
      whatsapp_user_id: normalize(whatsapp_user_id),
      updated_at: new Date().toISOString(),
    };

    const { error: identityError } = await ctx.supabase
      .from("identities_v3")
      .update(identityUpdate as Database["public"]["Tables"]["identities_v3"]["Update"])
      .eq("id", ctx.user.id);

    if (identityError) {
      console.warn("Identity sync warning:", identityError);
      // We log it but don't fail the action as profile is already updated
    }

    await logAudit(ctx, {
      action: "profile.update",
      entity: "profiles",
      entityId: ctx.user.id,
      metadata: { 
        profile_update: updateData,
        identity_sync: identityUpdate
      },
    });

    revalidatePath("/protected/profile");
    revalidatePath("/protected");

    return { success: true, message: "บันทึกข้อมูลโปรไฟล์สำเร็จ" };
  } catch (err) {
    return { success: false, message: mapDbError(err) || "Unauthorized" };
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
      const urlParts = currentProfile.avatar_url.split("/user-assets/");
      if (urlParts.length > 1) {
        const oldStoragePath = urlParts[urlParts.length - 1];
        if (oldStoragePath) {
          // ลบไฟล์เก่าออกจาก Storage
          await ctx.supabase.storage
            .from("user-assets")
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

  // ใช้ Timestamp + UUID เพื่อความ unique และป้องกันปัญหา Browser Cache (Cache Busting)
  const fileName = `${Date.now()}_${randomUUID()}.${ext || "jpg"}`;
  const filePath = `user-profiles/${ctx.user.id}/${fileName}`; // จัดกลุ่มตาม User ID เพื่อ RLS

  // 3. อัปโหลดรูปใหม่
  const { error: uploadError } = await ctx.supabase.storage
    .from("user-assets")
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Avatar upload error details:", uploadError);
    // แจ้ง Error ละเอียดขึ้นใน Console ของ Server
    throw new Error(
      mapDbError(uploadError) || `อัปโหลดไม่สำเร็จ: ${uploadError.message}`,
    );
  }

  // 4. สร้าง public URL
  const {
    data: { publicUrl },
  } = ctx.supabase.storage.from("user-assets").getPublicUrl(filePath);

  // 5. อัปเดต avatar_url ทั้งสองตารางเพื่อให้ข้อมูล Sync กันทั้งระบบ
    const [profileRes, identityRes] = await Promise.all([
      ctx.supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", ctx.user.id),
      ctx.supabase
        .from("identities_v3")
        .update({ avatar_url: publicUrl })
        .eq("id", ctx.user.id)
    ]);

  if (profileRes.error || identityRes.error) {
    console.error("Avatar URL update error:", profileRes.error || identityRes.error);
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

    if (!settings || typeof settings !== "object") {
      throw new Error("Invalid settings format");
    }

    const { error } = await ctx.supabase
      .from("profiles")
      .update({ notification_preferences: settings })
      .eq("id", ctx.user.id);

    if (error) {
      console.error("Error updating notification settings:", error);
      return {
        success: false,
        message: mapDbError(error) || "Failed to update settings",
      };
    }

    revalidatePath("/protected/profile");
    return { success: true, message: "บันทึกการตั้งค่าสำเร็จ" };
  } catch (error: unknown) {
    console.error("updateNotificationSettings error:", error);
    return {
      success: false,
      message: (error as Error).message || "Unauthorized or Error",
    };
  }
}

/**
 * อัปโหลดลายเซ็นดิจิทัล
 */
export async function uploadSignatureAction(
  formData: FormData,
): Promise<UploadAvatarResult> {
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("ไม่พบไฟล์รูปภาพลายเซ็น");
  }

  const ctx = await requireAuthContext();

  // 1. ดึงข้อมูลโปรไฟล์เพื่อหารูปเก่า
  const { data: currentProfile } = await ctx.supabase
    .from("profiles")
    .select("signature_url")
    .eq("id", ctx.user.id)
    .single();

  if (currentProfile?.signature_url) {
    try {
      const urlParts = currentProfile.signature_url.split("/user-assets/");
      if (urlParts.length > 1) {
        const oldStoragePath = urlParts[urlParts.length - 1];
        if (oldStoragePath) {
          await ctx.supabase.storage
            .from("user-assets")
            .remove([oldStoragePath]);
        }
      }
    } catch (removeError) {
      console.error("Error removing old signature:", removeError);
    }
  }

  // 2. เตรียมไฟล์ใหม่
  const originalName = file.name || "signature.png";
  const fileNameParts = originalName.split(".");
  const ext = fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() : "png";

  const fileName = `${Date.now()}_${randomUUID()}.${ext || "png"}`;
  const filePath = `user-signatures/${ctx.user.id}/${fileName}`;

  // 3. อัปโหลด
  const { error: uploadError } = await ctx.supabase.storage
    .from("user-assets")
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`อัปโหลดลายเซ็นไม่สำเร็จ: ${uploadError.message}`);
  }

  // 4. สร้าง public URL
  const {
    data: { publicUrl },
  } = ctx.supabase.storage.from("user-assets").getPublicUrl(filePath);

  // 5. อัปเดต signature_url ในตาราง profiles
  const { error: updateError } = await ctx.supabase
    .from("profiles")
    .update({ signature_url: publicUrl })
    .eq("id", ctx.user.id);

  if (updateError) {
    throw new Error("บันทึกข้อมูลลายเซ็นไม่สำเร็จ");
  }

  await logAudit(ctx, {
    action: "profile.signature.upload",
    entity: "profiles",
    entityId: ctx.user.id,
    metadata: { filePath, publicUrl },
  });

  revalidatePath("/protected/profile");
  return { path: filePath, publicUrl };
}

/**
 * ส่งข้อความทดสอบ LINE Flex Message
 */
export async function testLineNotificationAction(lineUserId: string): Promise<{ success: boolean; message: string }> {
  try {
    const ctx = await requireAuthContext();
    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", ctx.user.id)
      .single();

    const cleanLineUserId = lineUserId?.trim();
    if (!cleanLineUserId) {
      return { success: false, message: "กรุณาระบุรหัสไอดีผู้ใช้ไลน์ (LINE User ID) ก่อนทำการทดสอบ" };
    }

    const { notifyAgentOfSmartMatch } = await import("@/lib/line/messaging");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    await notifyAgentOfSmartMatch({
      lineUserId: cleanLineUserId,
      agentName: profile?.full_name || "Agent",
      leadName: "ลูกค้าทดสอบ (Test Lead)",
      propertyTitle: "บ้านเดี่ยวหรูย่านทองหล่อ (Test Property)",
      matchScore: 0.95,
      propertyImageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      propertyUrl: `${siteUrl}/protected/properties`,
      leadUrl: `${siteUrl}/protected/leads`,
    });

    return { success: true, message: "ระบบได้ทำการส่งการ์ด Flex Message ทดสอบไปยังไลน์ของคุณเรียบร้อยแล้ว!" };
  } catch (error: any) {
    console.error("testLineNotificationAction error:", error);
    return { success: false, message: error.message || "เกิดข้อผิดพลาดในการส่งข้อความทดสอบ" };
  }
}


