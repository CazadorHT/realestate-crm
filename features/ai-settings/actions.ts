"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { AiModelConfig, DEFAULT_CONFIG, AiModelChoice } from "./constants";

/**
 * Get AI Model Configuration from site_settings
 */
export async function getAiModelConfig(): Promise<AiModelConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "chatbot_model",
        "blog_generator_model",
        "translation_model",
        "description_model",
        "lead_model",
      ]);

    if (error) {
      console.error("Error fetching AI config:", error);
      return DEFAULT_CONFIG;
    }

    const config = { ...DEFAULT_CONFIG };

    for (const row of data || []) {
      const key = row.key as keyof AiModelConfig;
      if (key in config) {
        config[key] = row.value as AiModelChoice;
      }
    }

    return config;
  } catch (error) {
    console.error("Error in getAiModelConfig:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Update AI Model Configuration
 */
export async function updateAiModelConfig(
  config: Partial<AiModelConfig>,
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const updates = Object.entries(config).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    }));

    const { error } = await supabase
      .from("site_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      console.error("Error updating AI config:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/protected/admin/ai-config");

    return { success: true };
  } catch (error) {
    console.error("Error in updateAiModelConfig:", error);
    return { success: false, message: "Unknown error" };
  }
}
