"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============ TYPES ============

export type BudgetRange = {
  id: string;
  purpose: "BUY" | "RENT" | "INVEST";
  label: string;
  label_en: string | null;
  label_cn: string | null;
  min_value: number;
  max_value: number;
  sort_order: number | null;
  is_active: boolean | null;
};

export type PropertyTypeOption = {
  id: string;
  label: string;
  label_en: string | null;
  label_cn: string | null;
  value: string;
  sort_order: number | null;
  is_active: boolean | null;
};

export type SmartMatchSettings = {
  transit_question_enabled: boolean;
  wizard_title: string;
  wizard_title_en: string;
  wizard_title_cn: string;
  loading_text: string;
  loading_text_en: string;
  loading_text_cn: string;
  pdpa_text: string;
  pdpa_text_en: string;
  pdpa_text_cn: string;
};

export type OfficeSizeOption = {
  id: string;
  label: string;
  label_en: string | null;
  label_cn: string | null;
  min_sqm: number;
  max_sqm: number;
  sort_order: number | null;
  is_active: boolean | null;
};

// ============ BUDGET RANGES ============

export async function getBudgetRanges(
  purpose?: "BUY" | "RENT" | "INVEST",
): Promise<BudgetRange[]> {
  const supabase = await createClient();

  let query = supabase
    .from("smart_match_budget_ranges")
    .select("*")
    .order("sort_order", { ascending: true });

  if (purpose) {
    query = query.eq("purpose", purpose);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching budget ranges:", error);
    return [];
  }

  return (data as BudgetRange[]) || [];
}

export async function getActiveBudgetRanges(
  purpose: "BUY" | "RENT" | "INVEST",
): Promise<BudgetRange[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_match_budget_ranges")
    .select("*")
    .eq("purpose", purpose)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching active budget ranges:", error);
    return [];
  }

  return (data as BudgetRange[]) || [];
}

export async function createBudgetRange(
  input: Omit<BudgetRange, "id">,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_budget_ranges")
    .insert(input);

  if (error) {
    console.error("Error creating budget range:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

export async function updateBudgetRange(
  id: string,
  input: Partial<BudgetRange>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_budget_ranges")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error updating budget range:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

export async function deleteBudgetRange(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_budget_ranges")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting budget range:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

// ============ PROPERTY TYPES ============

export async function getPropertyTypes(): Promise<PropertyTypeOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_match_property_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching property types:", error);
    return [];
  }

  return data || [];
}

export async function getActivePropertyTypes(): Promise<PropertyTypeOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_match_property_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching active property types:", error);
    return [];
  }

  return data || [];
}

export async function createPropertyType(
  input: Omit<PropertyTypeOption, "id">,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_property_types")
    .insert(input);

  if (error) {
    console.error("Error creating property type:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

export async function updatePropertyType(
  id: string,
  input: Partial<PropertyTypeOption>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_property_types")
    .update(input)
    .eq("id", id);

  if (error) {
    console.error("Error updating property type:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

export async function deletePropertyType(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_property_types")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting property type:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

// ============ OFFICE SIZES ============

export async function getOfficeSizes(): Promise<OfficeSizeOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_match_office_sizes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching office sizes:", error);
    return [];
  }

  return (data as OfficeSizeOption[]) || [];
}

export async function getActiveOfficeSizes(): Promise<OfficeSizeOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_match_office_sizes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching active office sizes:", error);
    return [];
  }

  return (data as OfficeSizeOption[]) || [];
}

export async function createOfficeSize(
  input: Omit<OfficeSizeOption, "id">,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_office_sizes")
    .insert(input);

  if (error) {
    console.error("Error creating office size:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

export async function updateOfficeSize(
  id: string,
  input: Partial<OfficeSizeOption>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_office_sizes")
    .update(input)
    .eq("id", id);

  if (error) {
    console.error("Error updating office size:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

export async function deleteOfficeSize(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("smart_match_office_sizes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting office size:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

// ============ SETTINGS ============

const DEFAULT_SETTINGS: SmartMatchSettings = {
  transit_question_enabled: true,
  wizard_title: "วันนี้คุณกำลังมองหา...",
  wizard_title_en: "What are you looking for today?",
  wizard_title_cn: "您今天在寻找什么？",
  loading_text: "กำลังวิเคราะห์ข้อมูล...",
  loading_text_en: "Analyzing data...",
  loading_text_cn: "正在分析数据...",
  pdpa_text: "ข้อมูลของคุณจะถูกเก็บเป็นความลับตามนโยบาย PDPA",
  pdpa_text_en: "Your data will be kept confidential according to PDPA policy",
  pdpa_text_cn: "您的数据将根据 PDPA 政策保密",
};

export async function getSmartMatchSettings(): Promise<SmartMatchSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("smart_match_settings")
    .select("key, value");

  if (error || !data || data.length === 0) {
    console.error("Error fetching settings:", error);
    return DEFAULT_SETTINGS;
  }

  const settings: SmartMatchSettings = { ...DEFAULT_SETTINGS };

  data.forEach((row) => {
    const key = row.key as keyof SmartMatchSettings;
    if (key in settings) {
      // Parse JSON value
      try {
        const parsed = JSON.parse(row.value as string);
        (settings as any)[key] = parsed;
      } catch {
        // Use raw value if not JSON
        (settings as any)[key] = row.value;
      }
    }
  });

  return settings;
}

export async function updateSmartMatchSetting(
  key: string,
  value: any,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("smart_match_settings").upsert({
    key,
    value: JSON.stringify(value),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error updating setting:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/protected/settings/smart-match");
  return { success: true };
}

// ============ PUBLIC API (for SmartMatchWizard) ============

export async function getSmartMatchConfig() {
  const [buyRanges, rentRanges, propertyTypes, officeSizes, settings] =
    await Promise.all([
      getActiveBudgetRanges("BUY"),
      getActiveBudgetRanges("RENT"),
      getActivePropertyTypes(),
      getActiveOfficeSizes(),
      getSmartMatchSettings(),
    ]);

  return {
    buyBudgetRanges: buyRanges,
    rentBudgetRanges: rentRanges,
    propertyTypes,
    officeSizes,
    settings,
  };
}
