import { siteConfig, FEATURES, AppTier, FeatureName } from "./site-config";

/**
 * Checks if a specific feature is enabled for the current application tier.
 */
export function isFeatureEnabled(featureName: FeatureName): boolean {
  const tier = siteConfig.tier as AppTier;
  const tierFeatures = FEATURES[tier];

  const value = tierFeatures[featureName];
  if (typeof value === "boolean") {
    return value;
  }

  // If it's a number (quota), it's considered "enabled" if > 0
  if (typeof value === "number") {
    return value > 0;
  }

  return false;
}

/**
 * Gets the quota value for a specific feature (e.g., max_properties).
 */
export function getFeatureQuota(featureName: FeatureName): number {
  const tier = siteConfig.tier as AppTier;
  const tierFeatures = FEATURES[tier];

  const value = tierFeatures[featureName];
  if (typeof value === "number") {
    return value;
  }

  return 0;
}

/**
 * Helper to check if the current tier is at least a certain level.
 */
export function isAtLeastTier(requiredTier: AppTier): boolean {
  const currentTier = siteConfig.tier as AppTier;
  const tierOrder: AppTier[] = ["LITE", "PRO", "ENTERPRISE"];

  return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);
}
