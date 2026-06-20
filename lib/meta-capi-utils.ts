type MetaCapiEventParams = {
  eventName: string;
  eventId: string;
  url?: string;
  customData?: {
    contentIds?: string[];
    contentName?: string;
    contentType?: string;
    value?: number;
    currency?: string;
    email?: string;
    phone?: string;
    fullName?: string;
  };
};

export async function sendMetaCAPIEvent(params: MetaCapiEventParams) {
  try {
    const eventUrl = params.url || (typeof window !== "undefined" ? window.location.href : "");

    await fetch("/api/analytics/meta-capi", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: params.eventName,
        eventId: params.eventId,
        url: eventUrl,
        customData: params.customData,
      }),
    });
  } catch (error) {
    console.error("Failed to trigger Meta CAPI:", error);
  }
}

export function generateMetaEventId(prefix: string, propertyId: string) {
  const timestamp = Date.now();
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${propertyId}_${timestamp}_${randomPart}`;
}