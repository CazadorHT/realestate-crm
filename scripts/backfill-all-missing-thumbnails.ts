import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillAllMissingThumbnails() {
  console.log("Starting thumbnail backfill scan...");
  const BUCKET = "property-images";

  // Fetch cover images and all media from property_media_v3
  const { data: mediaItems, error } = await supabase
    .from("property_media_v3")
    .select("storage_path")
    .order("created_at", { ascending: false });

  if (error || !mediaItems) {
    console.error("Error fetching media:", error);
    return;
  }

  console.log(`Found ${mediaItems.length} total media items to inspect.`);
  let checked = 0;
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of mediaItems) {
    checked++;
    const rawPath = item.storage_path;
    if (!rawPath || !rawPath.endsWith(".webp") || rawPath.endsWith("-thumb.webp")) {
      skipped++;
      continue;
    }

    // Extract path inside property-images bucket
    const match = rawPath.match(/property-images\/(.+)$/);
    const storagePath = match ? match[1] : rawPath;

    const thumbPath = storagePath.replace(/\.webp$/i, "-thumb.webp");
    const dir = storagePath.substring(0, storagePath.lastIndexOf("/"));
    const fileName = storagePath.substring(storagePath.lastIndexOf("/") + 1);
    const thumbName = fileName.replace(/\.webp$/i, "-thumb.webp");

    try {
      // Check if thumbnail already exists in storage
      const { data: list } = await supabase.storage.from(BUCKET).list(dir, { search: thumbName });
      if (list && list.some((f) => f.name === thumbName)) {
        skipped++;
        continue;
      }

      // Download original image
      const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(storagePath);
      if (dlErr || !blob) {
        skipped++;
        continue;
      }

      const inputBuffer = Buffer.from(await blob.arrayBuffer());
      const thumbBuffer = await sharp(inputBuffer)
        .resize(600, null, { withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

      if (upErr) {
        errors++;
      } else {
        generated++;
        console.log(`[${checked}/${mediaItems.length}] Generated thumb: ${thumbName}`);
      }
    } catch {
      errors++;
    }
  }

  console.log(`Backfill complete! Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors}`);
}

backfillAllMissingThumbnails();
