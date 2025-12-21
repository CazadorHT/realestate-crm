/// <reference lib="deno.ns" />

import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const BUCKET = "property-images";
const TABLE = "property_image_uploads";

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

Deno.serve(async (req: Request) => {
  try {
    const body =
      req.method === "POST"
        ? await req.json().catch(() => ({} as Record<string, unknown>))
        : ({} as Record<string, unknown>);

    const cutoffHours = Number((body as any).cutoffHours ?? 24);
    const limit = Number((body as any).limit ?? 500);
    const dryRun = Boolean((body as any).dryRun ?? false);

    if (!Number.isFinite(cutoffHours) || cutoffHours <= 0) {
      return new Response(
        JSON.stringify({ ok: false, message: "cutoffHours must be > 0" }),
        { status: 400 }
      );
    }
    if (!Number.isFinite(limit) || limit <= 0 || limit > 2000) {
      return new Response(
        JSON.stringify({ ok: false, message: "limit must be 1..2000" }),
        { status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const cutoffIso = new Date(
      Date.now() - cutoffHours * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("storage_path, created_at")
      .eq("status", "TEMP")
      .lt("created_at", cutoffIso)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const paths = (data ?? [])
      .map((r: { storage_path: string | null }) => r.storage_path)
      .filter(
        (p: string | null): p is string =>
          typeof p === "string" &&
          p.length > 0 &&
          p.startsWith("properties/") &&
          !p.includes("..")
      );

    if (paths.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "nothing to cleanup",
          cutoffIso,
          limit,
        }),
        { status: 200 }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          ok: true,
          dryRun: true,
          candidates: paths.length,
          sample: paths.slice(0, 10),
          cutoffIso,
        }),
        { status: 200 }
      );
    }

    const pathChunks = chunk(paths, 50);
    let removedCount = 0;
    const removeErrors: Array<{ chunkIndex: number; message: string }> = [];

    for (let i = 0; i < pathChunks.length; i++) {
      const part = pathChunks[i];
      const { error: rmErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove(part);
      if (rmErr) removeErrors.push({ chunkIndex: i, message: rmErr.message });
      else removedCount += part.length;
    }

    const dbChunks = chunk(paths, 500);
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
        removedFromStorageApprox: removedCount,
        deletedRowsApprox,
        removeErrors,
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error("cleanup-property-temp-uploads error:", e);
    return new Response(JSON.stringify({ ok: false, message: String(e) }), {
      status: 500,
    });
  }
});
