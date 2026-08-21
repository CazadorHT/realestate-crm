import { NextResponse } from "next/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const body = await req.json();
    const { propertyId, base64DataUrl } = body || {};

    if (!propertyId || !base64DataUrl || typeof base64DataUrl !== "string" || !base64DataUrl.startsWith("data:image/")) {
      return NextResponse.json({ success: false, message: "Invalid image payload" }, { status: 400 });
    }

    const base64Data = base64DataUrl.split(",")[1];
    if (!base64Data) {
      return NextResponse.json({ success: false, message: "Invalid base64 encoding" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const buffer = Buffer.from(base64Data, "base64");
    const tempCoverPath = `social-covers/${propertyId}/cover_${Date.now()}.jpg`;

    const jpegBuf = await sharp(buffer)
      .resize(1080, 1350, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90 })
      .toBuffer();

    const { error: coverUploadErr } = await adminSupabase.storage
      .from("property-images")
      .upload(tempCoverPath, jpegBuf, {
        contentType: "image/jpeg",
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
