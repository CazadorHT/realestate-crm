import { 
  getPublicProperties as getProperties,
  getPublicPropertyBySlug as getPropertyBySlug
} from "@/lib/services/properties";
import { PublicProperty, PublicPropertyFilter } from "./types";

export async function getPublicProperties(
  filter: PublicPropertyFilter,
): Promise<PublicProperty[]> {
  try {
    const items = await getProperties(filter);
    return items as unknown as PublicProperty[];
  } catch (error) {
    console.error("Error fetching public properties:", error);
    return [];
  }
}

export async function getPublicPropertyBySlug(
  slug: string,
): Promise<PublicProperty | null> {
  try {
    const item = await getPropertyBySlug(slug);
    return item as unknown as PublicProperty;
  } catch (error) {
    console.error(`Error fetching public property by slug (${slug}):`, error);
    return null;
  }
}
