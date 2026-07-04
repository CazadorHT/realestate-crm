import { createAdminClient } from "../lib/supabase/admin";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const supabase = createAdminClient();
  console.log("Updating documents bucket allowed MIME types...");
  const { data, error } = await supabase.storage.updateBucket("documents", {
    public: false,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "text/html"
    ],
  });

  if (error) {
    console.error("Failed to update bucket:", error);
  } else {
    console.log("Successfully updated documents bucket!", data);
  }
}

main().catch(console.error);
