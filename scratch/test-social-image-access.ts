import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getPublicImageUrl } from "../features/properties/image-utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSocialImageAccess() {
  console.log("=================================================");
  console.log("🖼️ SOCIAL MEDIA IMAGE ACCESS TEST (FB / IG / TikTok)");
  console.log("=================================================\n");

  // 1. Fetch latest property images from DB
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, property_images ( image_url, storage_path )")
    .is("deleted_at", null)
    .not("property_images", "is", null)
    .limit(3);

  if (error || !properties || properties.length === 0) {
    console.error("❌ Failed to fetch properties for testing:", error);
    process.exit(1);
  }

  console.log(`📌 Found ${properties.length} test properties with images.\n`);

  for (const prop of properties) {
    console.log(`🏠 Property ID: ${prop.id}`);
    console.log(`   Title      : ${prop.title}`);

    const rawImages = (prop.property_images as any[]) || [];
    if (rawImages.length === 0) {
      console.log("   ⚠️ No images found for this property.\n");
      continue;
    }

    const firstImage = rawImages[0];
    const path = firstImage.storage_path || firstImage.image_url;
    const imageUrl = getPublicImageUrl(path);

    console.log(`   Image Path : ${path}`);
    console.log(`   Public URL : ${imageUrl}`);

    // Simulate Meta/Facebook/TikTok server crawling the image
    try {
      const start = Date.now();
      const res = await fetch(imageUrl, { method: "HEAD" });
      const duration = Date.now() - start;

      const contentType = res.headers.get("content-type");
      const contentLength = res.headers.get("content-length");

      console.log(`   HTTP Status: ${res.status} ${res.statusText}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Len : ${contentLength ? (Number(contentLength) / 1024).toFixed(2) + " KB" : "Unknown"}`);
      console.log(`   Response Time: ${duration} ms`);

      if (res.status === 200 && contentType?.startsWith("image/")) {
        console.log("   ✅ SUCCESS: Image is publicly accessible & ready for Meta/FB/IG/TikTok posting!\n");
      } else {
        console.log("   ❌ WARNING: Image returned non-200 or invalid Content-Type\n");
      }
    } catch (err: any) {
      console.log(`   ❌ ERROR testing URL: ${err.message}\n`);
    }
  }

  console.log("=================================================");
  console.log("✅ SOCIAL IMAGE TEST COMPLETE");
  console.log("=================================================");
}

testSocialImageAccess().catch(console.error);
