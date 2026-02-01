import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nxvoynycshhqiffygddv.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dm95bnljc2hocWlmZnlnZGR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNjQ3NiwiZXhwIjoyMDgwNzgyNDc2fQ.ptE9IzkeGCzJiFuQ6Zdou2pyj7Pw2hdQjQMH0hA24yE";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateAvatars() {
  console.log("Starting avatar migration...");

  // 1. List files in old 'avatars' bucket
  const { data: files, error: listError } = await supabase.storage
    .from("avatars")
    .list();

  if (listError) {
    console.error("Error listing old avatars:", listError);
    return;
  }

  if (!files || files.length === 0) {
    console.log("No avatars found in old bucket.");
  } else {
    for (const file of files) {
      console.log(`Processing ${file.name}...`);

      // Download from old bucket
      const { data: blob, error: downloadError } = await supabase.storage
        .from("avatars")
        .download(file.name);

      if (downloadError) {
        console.error(`Error downloading ${file.name}:`, downloadError);
        continue;
      }

      // Upload to new bucket: property-images/avatars/
      const newPath = `avatars/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(newPath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (uploadError) {
        console.error(
          `Error uploading ${file.name} to new bucket:`,
          uploadError,
        );
        continue;
      }

      console.log(
        `Successfully moved ${file.name} to property-images/avatars/`,
      );
    }
  }

  // 2. Update DB URLs
  console.log("Updating profile URLs in database...");
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .not("avatar_url", "is", null);

  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return;
  }

  for (const profile of profiles) {
    if (profile.avatar_url && profile.avatar_url.includes("/public/avatars/")) {
      const newUrl = profile.avatar_url.replace(
        "/public/avatars/",
        "/public/property-images/avatars/",
      );
      console.log(
        `Updating URL for ${profile.id}: ${profile.avatar_url} -> ${newUrl}`,
      );

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", profile.id);

      if (updateError) {
        console.error(`Error updating DB for ${profile.id}:`, updateError);
      }
    }
  }

  console.log("Migration complete!");
}

migrateAvatars();
