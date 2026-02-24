"use client";

import { SocialPostTask } from "@/components/properties/SocialPostMonitor";

const SOCIAL_POST_EVENT = "social-post-event";

export type SocialPostEventData =
  | { type: "STARTED"; task: SocialPostTask }
  | {
      type: "FINISHED";
      id: string;
      status: SocialPostTask["status"];
      message?: string;
    };

export function dispatchSocialPostEvent(data: SocialPostEventData) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent(SOCIAL_POST_EVENT, { detail: data });
  window.dispatchEvent(event);
}

export function useSocialPostEventListener(
  callback: (data: SocialPostEventData) => void,
) {
  if (typeof window === "undefined") return;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SocialPostEventData>;
    callback(customEvent.detail);
  };

  window.addEventListener(SOCIAL_POST_EVENT, handler);
  return () => window.removeEventListener(SOCIAL_POST_EVENT, handler);
}
