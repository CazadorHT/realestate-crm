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
 * FORCE re-generate ALL slugs (even if they already exist)
 */
async function forceRegenerateSlugs() {
  const supabase = createAdminClient();

  console.log("🔥 Force re-generating ALL slugs...\n");

  // Fetch ALL properties
  const { data: properties, error: fetchError } = await supabase
    .from("properties")
    .select("id, title, slug");

  if (fetchError) {
    console.error("❌ Error fetching properties:", fetchError);
    return;
  }

  if (!properties || properties.length === 0) {
    console.log("⚠️  No properties found!");
    return;
  }

  console.log(`📊 Found ${properties.length} properties\n`);

  // Generate new slugs
  const slugMap = new Map<string, number>();
  const updates: { id: string; oldSlug: string | null; newSlug: string }[] = [];

  for (const property of properties) {
    let baseSlug = generateSlug(property.title);

    // Handle duplicates
    if (slugMap.has(baseSlug)) {
      const count = slugMap.get(baseSlug)! + 1;
      slugMap.set(baseSlug, count);
      baseSlug = `${baseSlug}-${count}`;
    } else {
      slugMap.set(baseSlug, 1);
    }

    updates.push({
      id: property.id,
      oldSlug: property.slug,
      newSlug: baseSlug,
    });
  }

  // Update database
  console.log("💾 Updating database...\n");
  let successCount = 0;
  let errorCount = 0;
  let changedCount = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from("properties")
      .update({ slug: update.newSlug })
      .eq("id", update.id);

    if (error) {
      console.error(`❌ Failed to update ${update.id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
      if (update.oldSlug !== update.newSlug) {
        changedCount++;
      }
      if (successCount % 10 === 0) {
        console.log(
          `   ✓ Updated ${successCount}/${updates.length} properties...`
        );
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Re-generation complete!`);
  console.log(`   Total:   ${properties.length}`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Changed: ${changedCount}`);
  console.log(`   Errors:  ${errorCount}`);
  console.log("=".repeat(50));

  // Show examples of changes
  console.log("\n📋 Examples of slug changes:");
  const changed = updates.filter((u) => u.oldSlug !== u.newSlug).slice(0, 5);
  changed.forEach((u, i) => {
    const original = properties.find((p) => p.id === u.id);
    console.log(`   ${i + 1}. "${original?.title}"`);
    console.log(`      OLD: "${u.oldSlug}"`);
    console.log(`      NEW: "${u.newSlug}"`);
  });
}

// Run the migration
forceRegenerateSlugs()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
