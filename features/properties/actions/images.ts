"use server";
import { randomUUID } from "crypto";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { validateImageFile } from "@/lib/file-validation";
import { IMAGE_UPLOAD_POLICY } from "@/components/property-image-uploader/constants";
import {
  MIME_TO_EXT,
  PROPERTY_IMAGES_BUCKET,
  SESSION_ID_RE,
  UPLOAD_RATE_MAX,
  UPLOAD_RATE_WINDOW_MS,
  validatePropertyImagePaths,
} from "../logic/images";
import { mapDbError } from "@/lib/db-error";
import { getSystemConfig } from "@/lib/actions/system-config";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadedImageResult = {
  path: string; // storage_path เช่น "properties/xxxx.jpg"
  publicUrl: string; // public URL สำหรับแสดงผล
};

export type UploadImageActionResponse = 
  | (UploadedImageResult & { success?: true })
  | { success: false; message: string };

export async function uploadPropertyImageAction(formData: FormData): Promise<UploadImageActionResponse> {
  try {
    const { supabase, user, role, tenantId: contextTenantId } = await requireAuthContext();
    assertStaff(role);

    let tenantId = contextTenantId;
    // Fallback if tenantId is undefined (e.g. cookie is set to "ALL")
    if (!tenantId) {
      const { data: firstMember } = await supabase
        .from("tenant_members_v3")
        .select("tenant_id")
        .eq("identity_id", user.id)
        .limit(1)
        .maybeSingle();
      
      if (firstMember?.tenant_id) {
        tenantId = firstMember.tenant_id;
      } else {
        const { default_tenant_id } = await getSystemConfig();
        if (default_tenant_id) {
          tenantId = default_tenant_id;
        } else {
          // Ultimate fallback: get the first tenant in the system
          const { data: firstTenant } = await supabase
            .from("tenants_v3")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (firstTenant?.id) {
            tenantId = firstTenant.id;
          }
        }
      }
    }

    if (!tenantId) throw new Error("No active tenant context found (Multi-Tenant mode required)");

    const sessionId = formData.get("sessionId") as string | null;
    if (!sessionId) throw new Error("Missing sessionId");
    if (!SESSION_ID_RE.test(sessionId)) {
      throw new Error("Invalid sessionId");
    }

    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file provided");

    const watermark = formData.get("watermark") as string | null;

    // 1) Size limit
    if (file.size > IMAGE_UPLOAD_POLICY.maxBytes) {
      throw new Error("File too large (max 8MB)");
    }

    // 2) Validate (MIME + extension + magic bytes, block SVG)
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid image file");
    }

    // --- Server-side Optimization with Sharp ---
    let processedBuffer: Buffer;
    let fileName: string;
    let finalFileType = "image/webp";

    try {
      const { default: sharp } = await import("sharp");
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Resize and optional watermark composite
      let sharpImg = sharp(inputBuffer)
        .resize({
          width: 1920,
          withoutEnlargement: true,
          fit: "inside",
        });

      if (watermark === "true") {
        const svgWatermark = Buffer.from(
          `<svg width="70" height="70" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="vccGradFav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
              </linearGradient>
            </defs>
            <g transform="translate(10, 10) scale(0.6)">
              <!-- VCC Brand Isometric Icon Watermark (No font needed) -->
              <path d="M0 30l40-20v60l-40 20z" fill="#ffffff" fill-opacity="0.05"/>
              <path d="M40 10l40 20v60l-40-20z" fill="url(#vccGradFav)"/>
              <path d="M0 30l40-20 40 20-40 20z" fill="#ffffff" fill-opacity="0.06"/>
            </g>
          </svg>`
        );
        sharpImg = sharpImg.composite([
          {
            input: svgWatermark,
            gravity: "southeast",
          },
        ]);
      }

      processedBuffer = await sharpImg
        .webp({ quality: 80 })
        .toBuffer();

      fileName = `${randomUUID()}.webp`;
    } catch (sharpError) {
      console.error(
        "Sharp optimization failed, falling back to original:",
        sharpError,
      );
      // Fallback to original if sharp fails
      const arrayBuffer = await file.arrayBuffer();
      processedBuffer = Buffer.from(arrayBuffer);
      const ext = MIME_TO_EXT[file.type] ?? "jpg";
      fileName = `${randomUUID()}.${ext}`;
      finalFileType = file.type;
    }

    const adminSupabase = createAdminClient();

    // 3) Simple per-user rate limit based on property_image_uploads
    const cutoffIso = new Date(
      Date.now() - UPLOAD_RATE_WINDOW_MS,
    ).toISOString();
    const { count: recentCount, error: rateErr } = await adminSupabase
      .from("property_image_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", cutoffIso);

    // ถ้า query rate-limit พัง ไม่ควรทำให้ upload พัง (แต่กันได้เมื่อ query สำเร็จ)
    if (!rateErr && (recentCount ?? 0) >= UPLOAD_RATE_MAX) {
      throw new Error("Too many uploads. Please wait a moment and try again.");
    }

    const path = `${tenantId}/properties/${user.id}/${sessionId}/${fileName}`;

    const { error: uploadError } = await adminSupabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(path, processedBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: finalFileType,
      });

    if (uploadError) throw uploadError;

    // Insert TEMP tracking row
    const { error: trackErr } = await adminSupabase
      .from("property_image_uploads")
      .insert({
        user_id: user.id,
        session_id: sessionId,
        storage_path: path,
        status: "TEMP",
      });

    if (trackErr) {
      // ถ้า track ไม่ได้ -> ลบไฟล์ทิ้งกัน orphan
      await adminSupabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
      throw trackErr;
    }

    // Construct URL manually or use getPublicUrl
    const { data } = adminSupabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .getPublicUrl(path);

    return { path, publicUrl: data.publicUrl };
  } catch (error: unknown) {
    console.error("uploadPropertyImageAction → error:", error);
    if (error && typeof error === "object" && (("name" in error && error.name === "AuthzError") || ("code" in error && error.code === "AUTHZ_ERROR"))) {
      return { success: false, message: "Unauthorized" };
    }
    return { success: false, message: mapDbError(error) };
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
  const { supabase, user, role, tenantId: contextTenantId } = await requireAuthContext();
  assertStaff(role);

  let resolvedTenantId = contextTenantId;
  if (!resolvedTenantId && storagePath) {
    const pathParts = storagePath.split("/");
    const pathTenantId = pathParts[0];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathTenantId)) {
      resolvedTenantId = pathTenantId;
    }
  }

  if (!resolvedTenantId && role !== "ADMIN") throw new Error("No active tenant context found");

  // Verify membership if not admin and contextTenantId was not set
  if (role !== "ADMIN" && !contextTenantId && resolvedTenantId) {
    const { data: member } = await supabase
      .from("tenant_members_v3")
      .select("role")
      .eq("tenant_id", resolvedTenantId)
      .eq("identity_id", user.id)
      .maybeSingle();

    if (!member) throw new Error("Forbidden: You are not a member of this branch");
  }

  const expectedPrefix = resolvedTenantId ? `${resolvedTenantId}/properties/` : "properties/";

  const ok =
    storagePath?.startsWith(expectedPrefix) ||
    (role === "ADMIN"); // Admins can bypass prefix check to clean up legacy/cross-tenant

  if (!ok) throw new Error("Invalid storage path (ownership mismatch)");

  const adminSupabase = createAdminClient();

  const { error: storageErr } = await adminSupabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .remove([storagePath]);

  if (storageErr) {
    console.error(
      "deletePropertyImageFromStorage → storage error:",
      storageErr,
    );
    throw storageErr;
  }

  // ✅ Soft delete tracking row TEMP (เปลี่ยนสถานะเป็น DELETED แทนการลบจริง เพื่อกันการบายพาส Rate Limit)
  let del = adminSupabase
    .from("property_image_uploads")
    .update({ status: "DELETED" })
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

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
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
    await adminSupabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(paths);

    await adminSupabase
      .from("property_image_uploads")
      .update({ status: "DELETED" })
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .eq("status", "TEMP");
  }

  return { success: true };
}
