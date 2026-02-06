import { createClient } from "@/lib/supabase/server";

export const PROPERTY_IMAGES_BUCKET = "property-images";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
export const UPLOAD_RATE_WINDOW_MS = 60_000; // 1 minute
export const UPLOAD_RATE_MAX = 20; // uploads per window per user
export const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/;
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// ตรวจสอบความถูกต้องของ path ที่ส่งมา
export function validatePropertyImagePaths(paths: string[]) {
  const invalid = paths.filter(
    (p) =>
      typeof p !== "string" ||
      !p.startsWith("properties/") || // บังคับต้องอยู่ใต้โฟลเดอร์นี้
      p.includes("..") || // กัน path traversal
      p.startsWith("/"), // กัน absolute-ish
  );

  if (invalid.length > 0) {
    return {
      ok: false as const,
      message: `Invalid image path(s): ${invalid.slice(0, 3).join(", ")}${
        invalid.length > 3 ? "..." : ""
      }`,
    };
  }

  return { ok: true as const };
}

// ✅ สำเร็จแล้ว ลบ session ที่ไม่ใช้ คือ session ที่ไม่มีไฟล์ที่ใช้
export async function finalizeUploadSession(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  sessionId: string;
  propertyId: string;
  usedPaths: string[];
}) {
  const { supabase, userId, sessionId, propertyId, usedPaths } = params;
  const used = (usedPaths ?? []).filter(Boolean);
  // 1) mark used paths เป็น ATTACHED + ผูก property_id
  if (used.length > 0) {
    const { error: markErr } = await supabase
      .from("property_image_uploads")
      .update({ status: "ATTACHED", property_id: propertyId })
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .in("storage_path", used);

    if (markErr) throw markErr;
  }

  // 2) หา TEMP ที่เหลือใน session นี้ (ไม่ได้ใช้) → ลบจาก storage + ลบ tracking row
  const { data: leftovers, error: leftErr } = await supabase
    .from("property_image_uploads")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .eq("status", "TEMP");

  if (leftErr) throw leftErr;

  const toRemove = (leftovers ?? [])
    .map((x) => x.storage_path)
    .filter((p): p is string => !!p && !used.includes(p));

  if (toRemove.length > 0) {
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(toRemove);

    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("status", "TEMP");
  }
}
