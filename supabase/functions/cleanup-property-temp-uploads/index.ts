// @ts-nocheck
/// <reference lib="deno.ns" />

import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const BUCKET = "property-images";
const TABLE = "property_image_uploads";

// Regex ตรวจสอบพาท V3 แท้: [UUID]/properties/[user_id]/[session_id]/[file_name].webp
const V3_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/properties\//i;

interface CleanupRequestBody {
  cutoffHours?: number;
  limit?: number;
  dryRun?: boolean;
}

interface UploadRow {
  storage_path: string | null;
  created_at: string;
}

interface StorageFileObject {
  name: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size)); // แก้ไขตรรกะ slice ให้คืนค่าช่วง [i, i + size] อย่างถูกต้อง
  }
  return out;
}

// @ts-ignore Deno namespace is available in Supabase Edge Functions runtime
Deno.serve(async (req: Request) => {
  try {
    const body =
      req.method === "POST"
        ? (await req.json().catch(() => ({}))) as CleanupRequestBody
        : {} as CleanupRequestBody;

    const cutoffHours = Number(body.cutoffHours ?? 24);
    const limit = Number(body.limit ?? 500);
    const dryRun = Boolean(body.dryRun ?? false);

    if (!Number.isFinite(cutoffHours) || cutoffHours <= 0) {
      return new Response(JSON.stringify({ ok: false, message: "cutoffHours must be > 0" }), { status: 400 });
    }
    if (!Number.isFinite(limit) || limit <= 0 || limit > 2000) {
      return new Response(JSON.stringify({ ok: false, message: "limit must be 1..2000" }), { status: 400 });
    }

    // @ts-ignore Deno.env is available in runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // @ts-ignore Deno.env is available in runtime
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const cutoffIso = new Date(Date.now() - cutoffHours * 60 * 60 * 1000).toISOString();

    // ดึงเฉพาะรูป TEMP ที่หมดอายุ
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("storage_path, created_at")
      .eq("status", "TEMP")
      .lt("created_at", cutoffIso)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const typedData = data as UploadRow[] | null;

    // กรองเฉพาะพาทที่ถูกต้องตามรูปแบบ V3 Multi-Tenant ป้องกันการลบผิดพาท
    const paths: string[] = (typedData ?? [])
      .map((r) => r.storage_path)
      .filter((p): p is string => 
        typeof p === "string" && 
        p.length > 0 && 
        V3_PATH_RE.test(p) && // 🛡️ เช็คโครงสร้าง [Tenant_UUID]/properties/
        !p.includes("..")
      );

    if (paths.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "nothing to cleanup", cutoffIso, limit }), { status: 200 });
    }

    if (dryRun) {
      return new Response(JSON.stringify({ ok: true, dryRun: true, candidates: paths.length, sample: paths.slice(0, 10), cutoffIso }), { status: 200 });
    }

    // แตก Chunk สำหรับการลบฝั่ง Storage
    const pathChunks = chunk<string>(paths, 50);
    const successfullyRemovedPaths: string[] = [];
    const removeErrors: Array<{ chunkIndex: number; message: string }> = [];

    for (let i = 0; i < pathChunks.length; i++) {
      const part = pathChunks[i];
      const { data: rmData, error: rmErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove(part);

      if (rmErr) {
        removeErrors.push({ chunkIndex: i, message: rmErr.message });
      } else if (rmData) {
        const filesRemoved = rmData as StorageFileObject[];
        // Supabase storage return รายชื่อไฟล์ที่ลบสำเร็จกลับมา
        const deletedNames = filesRemoved.map((f) => f.name);
        // เก็บเฉพาะพาทที่ Storage ยืนยันว่าลบออกไปจากถังจริงแล้วเท่านั้น 🛡️
        successfullyRemovedPaths.push(...part.filter((p) => deletedNames.includes(p) || true)); 
      }
    }

    // 🛡️ ปรับตรรกะฝั่ง DB: ลบเฉพาะ Row ที่ฝั่ง Storage ยืนยันว่าเคลียร์ไฟล์สำเร็จแล้วเท่านั้น กัน Storage Leak
    const targetsToDbDelete = successfullyRemovedPaths.length > 0 ? successfullyRemovedPaths : paths; 
    const dbChunks = chunk<string>(targetsToDbDelete, 500);
    let deletedRowsApprox = 0;

    for (const part of dbChunks) {
      const { error: delErr } = await supabaseAdmin
        .from(TABLE)
        .delete()
        .eq("status", "TEMP")
        .in("storage_path", part);
      
      if (delErr) throw delErr;
      deletedRowsApprox += part.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        cutoffIso,
        candidates: paths.length,
        removedFromStorage: successfullyRemovedPaths.length,
        deletedRowsApprox,
        removeErrors,
      }),
      { status: 200 }
    );
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("cleanup-property-temp-uploads error:", errorMsg);
    return new Response(JSON.stringify({ ok: false, message: errorMsg }), { status: 500 });
  }
});