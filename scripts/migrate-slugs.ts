import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";

/**
 * Generate a URL-friendly slug from a Thai/English title
 * Preserves Thai characters (consonants, vowels, tone marks), English, and numbers
 */
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      // Remove emojis and special symbols (but keep Thai, English, numbers, spaces, slashes, underscores)
      .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\/_-]/g, "")
      // Replace spaces, slashes, underscores with hyphens
      .replace(/[\s\/_]+/g, "-")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit length to 100 characters
      .slice(0, 100)
  );
}

/**
 * Migration script to generate slugs for all properties
 */
async function migratePropertySlugs() {
  const supabase = createAdminClient();

  console.log("🚀 Starting slug migration...\n");

  // 1. Fetch all properties without slugs
  const { data: properties, error: fetchError } = await supabase
    .from("properties")
    .select("id, title, slug")
    .is("slug", null);

  if (fetchError) {
    console.error("❌ Error fetching properties:", fetchError);
    return;
  }

  if (!properties || properties.length === 0) {
    console.log("✅ All properties already have slugs!");
    return;
  }

  console.log(`📊 Found ${properties.length} properties without slugs\n`);

  // 2. Generate slugs and track duplicates
  const slugMap = new Map<string, number>();
  const updates: { id: string; slug: string }[] = [];

  for (const property of properties) {
    let baseSlug = generateSlug(property.title);

    // Handle duplicates by appending numbers
    if (slugMap.has(baseSlug)) {
      const count = slugMap.get(baseSlug)! + 1;
      slugMap.set(baseSlug, count);
      baseSlug = `${baseSlug}-${count}`;
    } else {
      slugMap.set(baseSlug, 1);
    }

    updates.push({ id: property.id, slug: baseSlug });
  }

  // 3. Update database
  console.log("💾 Updating database...\n");
  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from("properties")
      .update({ slug: update.slug })
      .eq("id", update.id);

    if (error) {
      console.error(`❌ Failed to update ${update.id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 10 === 0) {
        console.log(
          `   ✓ Updated ${successCount}/${updates.length} properties...`
        );
      }
    }
  }

  // 4. Summary
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Migration complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors:  ${errorCount}`);
  console.log("=".repeat(50));

  // 5. Show some examples
  console.log("\n📋 Sample slugs generated:");
  updates.slice(0, 5).forEach((u, i) => {
    const original = properties.find(
      (p: { id: string; title: string; slug: string | null }) => p.id === u.id
    );
    console.log(`   ${i + 1}. "${original?.title}" → "${u.slug}"`);
  });
}

// Run the migration
migratePropertySlugs()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
