"use server";
import { randomUUID } from "crypto";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { validateImageFile } from "@/lib/file-validation";
import { IMAGE_UPLOAD_POLICY } from "@/components/property-image-uploader";
import {
  MIME_TO_EXT,
  PROPERTY_IMAGES_BUCKET,
  SESSION_ID_RE,
  UPLOAD_RATE_MAX,
  UPLOAD_RATE_WINDOW_MS,
  validatePropertyImagePaths,
} from "../logic/images";

export type UploadedImageResult = {
  path: string; // storage_path เช่น "properties/xxxx.jpg"
  publicUrl: string; // public URL สำหรับแสดงผล
};

export async function uploadPropertyImageAction(formData: FormData) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const sessionId = formData.get("sessionId") as string | null;
    if (!sessionId) throw new Error("Missing sessionId");
    if (!SESSION_ID_RE.test(sessionId)) {
      throw new Error("Invalid sessionId");
    }

    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file provided");

    // 1) Size limit
    if (file.size > IMAGE_UPLOAD_POLICY.maxBytes) {
      throw new Error("File too large (max 8MB)");
    }

    // 2) Validate (MIME + extension + magic bytes, block SVG)
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid image file");
    }

    // 3) Simple per-user rate limit based on property_image_uploads
    const cutoffIso = new Date(
      Date.now() - UPLOAD_RATE_WINDOW_MS,
    ).toISOString();
    const { count: recentCount, error: rateErr } = await supabase
      .from("property_image_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", cutoffIso);

    // ถ้า query rate-limit พัง ไม่ควรทำให้ upload พัง (แต่กันได้เมื่อ query สำเร็จ)
    if (!rateErr && (recentCount ?? 0) >= UPLOAD_RATE_MAX) {
      throw new Error("Too many uploads. Please wait a moment and try again.");
    }

    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    const fileName = `${randomUUID()}.${ext}`;
    const path = `properties/${user.id}/${sessionId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    // Insert TEMP tracking row
    const { error: trackErr } = await supabase
      .from("property_image_uploads")
      .insert({
        user_id: user.id,
        session_id: sessionId,
        storage_path: path,
        status: "TEMP",
      });

    if (trackErr) {
      // ถ้า track ไม่ได้ -> ลบไฟล์ทิ้งกัน orphan
      await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
      throw trackErr;
    }

    // Construct URL manually or use getPublicUrl
    const { data } = supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .getPublicUrl(path);

    return { path, publicUrl: data.publicUrl };
  } catch (error) {
    console.error("uploadPropertyImageAction → error:", error);
    throw error;
  }
}

/**
 * Delete single image from storage
 * Used when user removes image from uploader before submission
 * ควรใช้ร่วมกับ requireAuthContext() เพื่อให้แน่ใจว่าผู้ใช้ล็อกอินแล้ว
 * ลบได้เฉพาะภาพที่อยู่ในโฟลเดอร์ properties/ เท่านั้น
 * ใช้เมื่อผู้ใช้ลบภาพที่อัปโหลดไปแล้วก่อนส่งฟอร์ม
 */

export async function deletePropertyImageFromStorage(storagePath: string) {
  const { supabase, user, role } = await requireAuthContext();
  assertStaff(role);

  const mustStartWith = "properties/";

  const ok =
    storagePath?.startsWith(mustStartWith) ||
    (role === "ADMIN" && storagePath?.startsWith("properties/"));

  if (!ok) throw new Error("Invalid storage path (ownership mismatch)");

  const { error: storageErr } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove([storagePath]);

  if (storageErr) {
    console.error(
      "deletePropertyImageFromStorage → storage error:",
      storageErr,
    );
    throw storageErr;
  }

  // ✅ ลบ tracking row TEMP
  let del = supabase
    .from("property_image_uploads")
    .delete()
    .eq("user_id", user.id)
    .eq("storage_path", storagePath)
    .eq("status", "TEMP");

  if (role !== "ADMIN") {
    del = del.eq("user_id", user.id);
  }

  const { error: trackErr } = await del;
  if (trackErr) {
    console.error(
      "deletePropertyImageFromStorage → tracking delete error:",
      trackErr,
    );
    // จะ throw หรือไม่ throw ก็ได้; แนะนำไม่ throw เพราะ storage ลบไปแล้ว
  }

  return { success: true };
}

export async function cleanupUploadSessionAction(sessionId: string) {
  const { supabase, user, role } = await requireAuthContext();
  assertStaff(role);

  if (!sessionId) return { success: true };

  const { data, error } = await supabase
    .from("property_image_uploads")
    .select("storage_path")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .eq("status", "TEMP");

  if (error) throw error;

  const paths = (data ?? [])
    .map((x) => x.storage_path)
    .filter((p): p is string => !!p);

  if (paths.length > 0) {
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(paths);

    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .eq("status", "TEMP");
  }

  return { success: true };
}
