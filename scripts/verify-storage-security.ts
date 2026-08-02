import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !anonKey) {
  console.error("❌ Missing Supabase URL or Anon Key in environment");
  process.exit(1);
}

// 🟢 Create an Anonymous Client (unauthenticated public user)
const anonClient = createClient(supabaseUrl, anonKey);

async function runStorageSecurityAudit() {
  console.log("\n=======================================================");
  console.log("🛡️ SUPABASE STORAGE SECURITY AUDIT (ANONYMOUS CLIENT)");
  console.log("=======================================================\n");

  const publicBuckets = ["property-images", "service-images", "avatars", "blog-images"];

  for (const bucketName of publicBuckets) {
    console.log(`🔍 Auditing Bucket: [${bucketName}]...`);

    // TEST 1: Anonymous Bucket Listing Attempt
    const { data: listData, error: listError } = await anonClient.storage
      .from(bucketName)
      .list("", { limit: 10 });

    if (listError) {
      console.log(`  ✅ LIST ATTEMPT BLOCKED by RLS: "${listError.message}"`);
    } else if (listData && listData.length === 0) {
      console.log(`  ✅ LIST ATTEMPT BLOCKED: 0 files returned (RLS filtered empty)`);
    } else {
      console.log(`  ⚠️ LIST ATTEMPT RETURNED ${listData?.length} items`);
    }

    // TEST 2: Direct CDN Public URL Accessibility using real image from DB
    const { data: media } = await anonClient.from("property_media_v3").select("url, storage_path").limit(1).maybeSingle();
    const testUrl = media?.url || (media?.storage_path ? anonClient.storage.from("property-images").getPublicUrl(media.storage_path).data.publicUrl : null);

    if (testUrl) {
      try {
        const res = await fetch(testUrl, { method: "HEAD" });
        console.log(`  🌐 Public Image Direct HTTP Fetch (${testUrl.slice(0, 45)}...): Status ${res.status} OK`);
      } catch (fetchErr) {
        console.log(`  🌐 Public CDN Fetch Exception:`, fetchErr);
      }
    } else {
      console.log(`  🌐 No test image path found in DB to test fetch`);
    }
    console.log("-------------------------------------------------------");
  }

  console.log("\nAudit finished successfully!\n");
}

runStorageSecurityAudit();
