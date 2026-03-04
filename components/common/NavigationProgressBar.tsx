"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

/**
 * Renders a slim, animated progress bar at the top of the page
 * whenever a Next.js client-side navigation is in progress.
 * Wrapped here as a standalone client component so it can be
 * imported inside a Server Component layout without errors.
 */
export function NavigationProgressBar() {
  return (
    <ProgressBar
      height="3px"
      color="#3b82f6"
      options={{ showSpinner: false, trickleSpeed: 200 }}
      shallowRouting
    />
  );
}
