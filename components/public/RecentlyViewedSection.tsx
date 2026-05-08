import { getRecommendedProperties } from "@/features/properties/recommended-actions";
import { RecentlyViewedClient } from "@/components/public/RecentlyViewedClient";

/**
 * Server Component Wrapper
 * Fetches data on the server and passes it to the client component
 */
export async function RecentlyViewedSection() {
  return <RecentlyViewedClient />;
}
