"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type IntegrationProvider = "tiktok" | "facebook" | "google" | "line";

/**
 * Server action to disconnect an integration by removing its tokens from site_settings
 */
export async function disconnectIntegrationAction(
  provider: IntegrationProvider,
) {
  try {
    const supabase = await createClient();

    let keysToRemove: string[] = [];

    switch (provider) {
      case "tiktok":
        keysToRemove = ["tiktok_auth_token"];
        break;
      case "facebook":
        keysToRemove = [
          "meta_page_access_token",
          "meta_page_id",
          "meta_user_access_token",
        ];
        break;
      case "google":
        keysToRemove = ["google_integration_tokens"];
        break;
      case "line":
        keysToRemove = ["line_channel_access_token"];
        // Also clear any profile's line_id if we want to be thorough,
        // but for now we'll stick to system-wide settings.
        break;
    }

    if (keysToRemove.length > 0) {
      const { error } = await supabase
        .from("site_settings")
        .delete()
        .in("key", keysToRemove);

      if (error) {
        console.error(`Error disconnecting ${provider}:`, error);
        return {
          success: false,
          message: `ไม่สามารถยกเลิกการเชื่อมต่อ ${provider} ได้`,
        };
      }
    }

    revalidatePath("/protected/settings");
    return {
      success: true,
      message: `ยกเลิกการเชื่อมต่อ ${provider} เรียบร้อยแล้ว`,
    };
  } catch (err) {
    console.error(`Exception disconnecting ${provider}:`, err);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
    };
  }
}
