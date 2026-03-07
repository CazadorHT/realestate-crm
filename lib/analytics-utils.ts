/**
 * Utility for capturing marketing attribution and calculating engagement scores
 */
import { pushToDataLayer, GTM_EVENTS } from "./gtm";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];
const STORAGE_KEY_UTM = "realestate_crm_utm";
const STORAGE_KEY_SCORE = "realestate_crm_score";
const STORAGE_KEY_REFRERREC = "realestate_crm_ref";
const STORAGE_KEY_PREFS = "realestate_crm_prefs";

export type UtmData = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referral_url?: string;
};

/**
 * Capture UTM parameters from URL and store in SessionStorage
 */
export const captureUtmParams = () => {
  if (typeof window === "undefined") return;

  const urlParams = new URLSearchParams(window.location.search);
  const utm: UtmData = {};
  let hasUtm = false;

  UTM_KEYS.forEach((key) => {
    const value = urlParams.get(key);
    if (value) {
      utm[key as keyof UtmData] = value;
      hasUtm = true;
    }
  });

  // Store if new UTMs found
  if (hasUtm) {
    sessionStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(utm));
  }

  // Store referral if not internal
  const referrer = document.referrer;
  if (referrer && !referrer.includes(window.location.hostname)) {
    sessionStorage.setItem(STORAGE_KEY_REFRERREC, referrer);
  }
};

/**
 * Get stored UTM and Referral data
 */
export const getStoredMarketingData = (): UtmData => {
  if (typeof window === "undefined") return {};

  const utmStr = sessionStorage.getItem(STORAGE_KEY_UTM);
  const ref = sessionStorage.getItem(STORAGE_KEY_REFRERREC);

  const data: UtmData = utmStr ? JSON.parse(utmStr) : {};
  if (ref) data.referral_url = ref;

  return data;
};

/**
 * AI Lead Scoring Logic (Client-side engagement tracking)
 * In a real scenario, this would be more complex and possibly involve a backend/AI model.
 */
export const trackEngagement = () => {
  if (typeof window === "undefined") return;

  const currentScoreStr = localStorage.getItem(STORAGE_KEY_SCORE) || "0";
  let score = parseInt(currentScoreStr);

  // Simple scoring rules:
  // - Viewing a property: +5 points
  // - Viewing a gallery: +2 points
  // - Adding to favorite: +15 points
  // - Sharing: +10 points

  // Note: We'll call this function from respective components
};

export const updateAIScore = (points: number) => {
  if (typeof window === "undefined") return 0;

  const currentScoreStr = localStorage.getItem(STORAGE_KEY_SCORE) || "0";
  const newScore = parseInt(currentScoreStr) + points;
  localStorage.setItem(STORAGE_KEY_SCORE, newScore.toString());

  // Push to GTM so it can be tracked in real-time
  try {
    const marketingData = getStoredMarketingData();
    pushToDataLayer(GTM_EVENTS.AI_LEAD_SCORE, {
      score: newScore,
      hot_lead: newScore >= 50,
      utm_source: marketingData.utm_source || "direct",
    });
  } catch (err) {
    console.error("Failed to push AI score to GTM:", err);
  }

  return newScore;
};

export const getAIScore = () => {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || "0");
};

export const getAIStatusLabel = (score: number) => {
  if (score >= 50) return "🔥 High Intent / Hot Lead";
  if (score >= 20) return "⚡ Warm Lead";
  return "❄️ New Visitor";
};

/**
 * Track user property preferences (Type, Price, Location)
 */
export const trackPropertyPreference = (category: string) => {
  if (typeof window === "undefined" || !category) return;

  const prefsStr = localStorage.getItem(STORAGE_KEY_PREFS) || "{}";
  const prefs = JSON.parse(prefsStr);

  // Simple frequency count for categories
  prefs.categories = prefs.categories || {};
  prefs.categories[category] = (prefs.categories[category] || 0) + 1;

  localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
};

/**
 * Get the most preferred category
 */
export const getPreferredCategory = (): string | null => {
  if (typeof window === "undefined") return null;

  const prefsStr = localStorage.getItem(STORAGE_KEY_PREFS);
  if (!prefsStr) return null;

  const prefs = JSON.parse(prefsStr);
  const categories = prefs.categories || {};

  return (
    Object.keys(categories).reduce((a, b) =>
      categories[a] > categories[b] ? a : b,
    ) || null
  );
};
