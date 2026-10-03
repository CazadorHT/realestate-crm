import { NextResponse } from "next/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    let propertyId = "";
    let buffer: Buffer;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      propertyId = (formData.get("propertyId") as string) || "";
      const file = formData.get("file") as File | null;

      if (!file || !propertyId) {
        return NextResponse.json({ success: false, message: "Missing file or propertyId" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      propertyId = body?.propertyId || "";
      const base64DataUrl = body?.base64DataUrl;

      if (!propertyId || !base64DataUrl || typeof base64DataUrl !== "string" || !base64DataUrl.startsWith("data:image/")) {
        return NextResponse.json({ success: false, message: "Invalid image payload" }, { status: 400 });
      }

      const base64Data = base64DataUrl.split(",")[1];
      if (!base64Data) {
        return NextResponse.json({ success: false, message: "Invalid base64 encoding" }, { status: 400 });
      }

      buffer = Buffer.from(base64Data, "base64");
    }

    // Staff upload size limit check (Max 20MB)
    const MAX_STAFF_UPLOAD_BYTES = 20 * 1024 * 1024;
    if (buffer.length > MAX_STAFF_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, message: "ขนาดไฟล์ใหญ่เกินไป (ไม่เกิน 20MB)" },
        { status: 400 }
      );
    }

    const tempCoverPath = `social-covers/${propertyId}/cover_${Date.now()}.jpg`;

    const jpegBuf = await sharp(buffer)
      .resize(1080, 1350, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90 })
      .toBuffer();

    const adminSupabase = createAdminClient();
    const { error: coverUploadErr } = await adminSupabase.storage
      .from("property-images")
      .upload(tempCoverPath, jpegBuf, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: true,
      });

    if (coverUploadErr) {
      console.error("[/api/upload-cover] Storage upload error:", coverUploadErr);
      return NextResponse.json({ success: false, message: coverUploadErr.message }, { status: 500 });
    }

    const cdnUrl = `https://cdn.vccasset.com/storage/v1/object/public/property-images/${tempCoverPath}`;
    return NextResponse.json({ success: true, url: cdnUrl });
  } catch (err: any) {
    console.error("[/api/upload-cover] Exception:", err);
    return NextResponse.json({ success: false, message: err?.message || "Upload failed" }, { status: 500 });
  }
}
