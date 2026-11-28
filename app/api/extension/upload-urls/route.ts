import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { requireAuthContext } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthContext();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { urls?: string[] };
    const uniqueUrls = Array.from(
      new Set((body.urls ?? []).filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))),
    ).slice(0, 30);

    if (uniqueUrls.length === 0) {
      return NextResponse.json({ ok: false, error: "ไม่พบลิงก์รูปภาพที่ถูกต้อง" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const batchId = randomUUID();
    const uploadedPaths: string[] = [];

    const BATCH_SIZE = 4;
    for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
      const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (url, idx) => {
          const num = String(i + idx + 1).padStart(2, "0");
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(url, {
              signal: controller.signal,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
              },
            });
            clearTimeout(timer);
            if (!res.ok) return null;

            const rawBuf = Buffer.from(await res.arrayBuffer());
            if (rawBuf.length < 2000) return null;

            const webpBuf = await sharp(rawBuf)
              .rotate()
              .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
              .webp({ quality: 84 })
              .toBuffer();

            const storagePath = `vcc-import/${batchId}/${num}.webp`;
            const { error } = await adminSupabase.storage
              .from("property-images")
              .upload(storagePath, webpBuf, {
                contentType: "image/webp",
                upsert: true,
              });

            if (error) return null;
            return storagePath;
          } catch {
            return null;
          }
        }),
      );

      for (const p of results) {
        if (p) uploadedPaths.push(p);
      }
    }

    return NextResponse.json({
      ok: uploadedPaths.length > 0,
      paths: uploadedPaths,
      count: uploadedPaths.length,
    });
  } catch (err) {
    console.error("[UploadUrls] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
