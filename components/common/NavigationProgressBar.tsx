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
      height="3.5px"
      color="#2563eb"
      options={{ showSpinner: true, trickleSpeed: 100 }}
      shallowRouting
    />
  );
}
