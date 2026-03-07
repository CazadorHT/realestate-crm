/**
 * Utility for pushing events to Google Tag Manager dataLayer
 */
export const pushToDataLayer = (
  event: string,
  params: Record<string, any> = {},
) => {
  if (typeof window !== "undefined") {
    // Ensure dataLayer exists
    const dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer = dataLayer;

    // Push the event
    dataLayer.push({
      event,
      ...params,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Standard event names for consistency
 */
export const GTM_EVENTS = {
  // Contact Events
  CLICK_LINE: "click_line",
  CLICK_PHONE: "click_phone",
  SUBMIT_CONTACT_FORM: "submit_contact_form",

  // Engagement Events
  ADD_FAVORITE: "add_favorite",
  ADD_COMPARE: "add_compare",
  VIEW_GALLERY: "view_gallery",
  VIEW_GALLERY_FULL: "view_gallery_full",
  SHARE_PROPERTY: "share_property",
  SCROLL_DEPTH: "scroll_depth",
  AI_LEAD_SCORE: "ai_lead_score",

  // Search Events
  SEARCH_FILTER: "search_filter",
  SEARCH_NO_RESULTS: "search_no_results",
  SEARCH_KEYWORD: "search_keyword",
  SYSTEM_ERROR: "system_error",
};
