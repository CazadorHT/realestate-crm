import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nxvoynycshhqiffygddv.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dm95bnljc2hocWlmZnlnZGR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNjQ3NiwiZXhwIjoyMDgwNzgyNDc2fQ.ptE9IzkeGCzJiFuQ6Zdou2pyj7Pw2hdQjQMH0hA24yE";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalMigration() {
  console.log("Starting FINAL avatar migration to user-profiles folder...");

  // 1. Source 1: Old 'avatars' bucket
  const { data: oldFiles } = await supabase.storage.from("avatars").list();

  // 2. Source 2: 'property-images' bucket, 'avatars' folder (the one that might be restricted)
  const { data: restrictedFiles } = await supabase.storage
    .from("property-images")
    .list("avatars");

  const sources = [
    { bucket: "avatars", folder: "", files: oldFiles || [] },
    {
      bucket: "property-images",
      folder: "avatars/",
      files: restrictedFiles || [],
    },
  ];

  for (const source of sources) {
    console.log(`Processing source: ${source.bucket}/${source.folder}`);
    for (const file of source.files) {
      if (file.name === ".emptyFolderPlaceholder") continue;

      console.log(`Moving ${file.name}...`);

      const { data: blob, error: de } = await supabase.storage
        .from(source.bucket)
        .download(source.folder + file.name);
      if (de) {
        console.error(`DL Error for ${file.name}:`, de);
        continue;
      }

      const { error: ue } = await supabase.storage
        .from("property-images")
        .upload("user-profiles/" + file.name, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (ue) {
        console.error(`UL Error for ${file.name}:`, ue);
      } else {
        console.log(`Moved ${file.name} to user-profiles/`);
      }
    }
  }

  // 3. Update all profiles in DB
  console.log("Updating database URLs...");
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .not("avatar_url", "is", null);

  for (const profile of profiles || []) {
    let newUrl = profile.avatar_url;

    // Case 1: Old avatars bucket
    if (newUrl.includes("/public/avatars/")) {
      newUrl = newUrl.replace(
        "/public/avatars/",
        "/public/property-images/user-profiles/",
      );
    }
    // Case 2: Restricted avatars folder in property-images
    else if (newUrl.includes("/public/property-images/avatars/")) {
      newUrl = newUrl.replace(
        "/public/property-images/avatars/",
        "/public/property-images/user-profiles/",
      );
    }

    if (newUrl !== profile.avatar_url) {
      console.log(`Updating ${profile.id}: ${newUrl}`);
      await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", profile.id);
    }
  }

  console.log("FINAL Migration Complete!");
}

finalMigration();
