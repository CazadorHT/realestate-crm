import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as crypto from "crypto";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "fallback-secret-at-least-32-chars-long";
const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
}

function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;
  const parts = encryptedText.split(":");
  if (parts.length !== 3) return encryptedText;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    return encryptedText;
  }
}

async function syncLeadAvatars() {
  console.log("Fetching leads without avatar_url...");
  
  const { data: identities, error } = await supabase
    .from("identities_v3")
    .select("id, display_name, social_links, avatar_url")
    .eq("role", "LEAD");

  if (error || !identities) {
    console.error("Error fetching identities:", error);
    return;
  }

  console.log(`Found ${identities.length} total leads to check.`);

  for (const ident of identities) {
    const links = (ident.social_links as Record<string, any>) || {};
    const fbPsidEnc = links.facebook_psid;
    const igSidEnc = links.instagram_sid;

    let avatarUrl: string | null = ident.avatar_url;

    if (!avatarUrl && fbPsidEnc) {
      const psid = decrypt(fbPsidEnc);
      if (psid && pageAccessToken) {
        try {
          console.log(`Fetching Facebook profile picture for PSID: ${psid}...`);
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${psid}?fields=profile_pic,name&access_token=${pageAccessToken}`
          );
          const json = await res.json();
          if (json.profile_pic) {
            avatarUrl = json.profile_pic;
            console.log(`Got FB profile pic for ${json.name || ident.id}: ${avatarUrl}`);
          }
        } catch (e) {
          console.error(`Failed to fetch FB profile pic for ${psid}:`, e);
        }
      }
    }

    if (!avatarUrl && igSidEnc) {
      const sid = decrypt(igSidEnc);
      if (sid && pageAccessToken) {
        try {
          console.log(`Fetching Instagram profile picture for SID: ${sid}...`);
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${sid}?fields=profile_pic,username&access_token=${pageAccessToken}`
          );
          const json = await res.json();
          if (json.profile_pic) {
            avatarUrl = json.profile_pic;
            console.log(`Got IG profile pic for ${json.username || ident.id}: ${avatarUrl}`);
          }
        } catch (e) {
          console.error(`Failed to fetch IG profile pic for ${sid}:`, e);
        }
      }
    }

    if (avatarUrl && avatarUrl !== ident.avatar_url) {
      console.log(`Updating avatar_url for identity ${ident.id}...`);
      await supabase
        .from("identities_v3")
        .update({ avatar_url: avatarUrl })
        .eq("id", ident.id);
    }
  }

  console.log("Avatar sync process completed!");
}

syncLeadAvatars().catch(console.error);
