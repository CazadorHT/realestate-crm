"use server";

import { revalidatePath } from "next/cache";
import { CommissionRuleSet } from "@/lib/finance/commissions";
import { getSiteSetting, updateSiteSetting } from "@/features/site-settings/actions";
import { SiteSettingKey } from "@/features/site-settings/schema";

export type CommissionActionResponse = {
  success: boolean;
  message?: string;
  data?: CommissionRuleSet;
};

const SETTINGS_KEY = "commission_rules";

/**
 * Get the global commission rules from site_settings
 */
export async function getCommissionRulesAction(): Promise<CommissionActionResponse> {
  try {
    const data = await getSiteSetting(SETTINGS_KEY as SiteSettingKey);

    if (!data) {
      // Not found, return default
      return {
        success: true,
        data: {
          type: "TIERED",
          tiers: [
            { minPrice: 0, maxPrice: 5000000, percentage: 3 },
            { minPrice: 5000001, maxPrice: 10000000, percentage: 4 },
            { minPrice: 10000001, maxPrice: null, percentage: 5 },
          ],
          defaultListingPercent: 30,
          defaultClosingPercent: 50,
          defaultAgencyPercent: 20,
          defaultTeamPoolPercent: 2,
          enableTeamPoolByDefault: false,
          enableAdvancedSplit: true,
        },
      };
    }

    const ruleSet = data as unknown as CommissionRuleSet;

    return {
      success: true,
      data: {
        ...ruleSet,
        defaultWhtRate: ruleSet.defaultWhtRate ?? 3,
        defaultListingPercent: ruleSet.defaultListingPercent ?? 30,
        defaultClosingPercent: ruleSet.defaultClosingPercent ?? 50,
        defaultAgencyPercent: ruleSet.defaultAgencyPercent ?? 20,
        defaultTeamPoolPercent: ruleSet.defaultTeamPoolPercent ?? 2,
        enableTeamPoolByDefault: ruleSet.enableTeamPoolByDefault ?? false,
        enableAdvancedSplit: ruleSet.enableAdvancedSplit ?? true,
      },
    };
  } catch (error) {
    console.error("Error fetching commission rules:", error);
    return {
      success: false,
      message: "ไม่สามารถดึงข้อมูลการตั้งค่าได้",
    };
  }
}

/**
 * Save the global commission rules to site_settings
 */
export async function saveCommissionRulesAction(
  ruleSet: CommissionRuleSet,
): Promise<CommissionActionResponse> {
  try {
    const result = await updateSiteSetting(
      SETTINGS_KEY as SiteSettingKey,
      ruleSet as unknown as Record<string, unknown>
    );

    if (!result.success) throw new Error(result.message);

    revalidatePath("/protected/dashboard");
    revalidatePath("/protected/deals");

    return {
      success: true,
      message: "บันทึกการตั้งค่าแล้ว",
    };
  } catch (error) {
    console.error("Error saving commission rules:", error);
    return {
      success: false,
      message: "ไม่สามารถบันทึกข้อมูลได้",
    };
  }
}
