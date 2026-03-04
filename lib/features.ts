import { FeatureName } from "./site-config";

/**
 * Checks if a specific feature is enabled (Always true now).
 */
export function isFeatureEnabled(featureName: FeatureName): boolean {
  return true;
}

/**
 * Gets the quota value for a specific feature (Always high now).
 */
export function getFeatureQuota(featureName: FeatureName): number {
  if (featureName === "max_properties") return 99999;
  return 1;
}

/**
 * Helper to check if the current tier is at least a certain level (Always true).
 */
export function isAtLeastTier(requiredTier: string): boolean {
  return true;
}
