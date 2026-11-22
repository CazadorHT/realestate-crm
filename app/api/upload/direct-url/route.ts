import { NextRequest, NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

// Allowed buckets for direct upload
const ALLOWED_BUCKETS = new Set([
  "property-images",
  "documents",
  "service-images",
  "avatars",
]);

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "svg",
  "pdf", "doc", "docx", "xls", "xlsx", "csv"
]);

export async function POST(req: NextRequest) {
  try {
    const { user, tenantId } = await requireAuthContext();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, bucket, folder = "general" } = body;

    if (!fileName || !bucket) {
      return NextResponse.json(
        { success: false, message: "fileName and bucket are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json(
        { success: false, message: `Bucket '${bucket}' is not permitted for direct upload` },
        { status: 403 }
      );
    }

    // Sanitize extension
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, message: `File extension '.${ext}' is not permitted` },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const safeTenant = tenantId || "shared";
    const uniqueFileName = `${randomUUID()}.${ext}`;
    const filePath = `${safeTenant}/${folder}/${user.id}/${uniqueFileName}`;

    // Generate signed upload URL from Supabase Storage
    const { data, error } = await adminSupabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("[DirectUpload] Error creating signed upload url:", error);
      return NextResponse.json(
        { success: false, message: error?.message || "Failed to generate upload URL" },
        { status: 500 }
      );
    }

    // Get the final public URL for when upload completes
    const { data: publicUrlData } = adminSupabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error: any) {
    console.error("[DirectUpload Exception]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
