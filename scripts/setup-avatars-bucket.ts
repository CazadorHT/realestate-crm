import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nxvoynycshhqiffygddv.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dm95bnljc2hocWlmZnlnZGR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNjQ3NiwiZXhwIjoyMDgwNzgyNDc2fQ.ptE9IzkeGCzJiFuQ6Zdou2pyj7Pw2hdQjQMH0hA24yE";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('Checking for "avatars" bucket...');

  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const avatarBucket = buckets.find((b) => b.name === "avatars");

  if (!avatarBucket) {
    console.log('Creating "avatars" bucket...');
    const { data: newBucket, error: createError } =
      await supabase.storage.createBucket("avatars", {
        public: true,
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
        ],
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
      });

    if (createError) {
      console.error("Error creating bucket:", createError);
    } else {
      console.log('Successfully created "avatars" bucket:', newBucket);
    }
  } else {
    console.log('"avatars" bucket already exists.');
    if (!avatarBucket.public) {
      console.log('Updating "avatars" bucket to be public...');
      await supabase.storage.updateBucket("avatars", { public: true });
    }
  }
}

setupStorage();
