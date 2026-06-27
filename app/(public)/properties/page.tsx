import { Metadata } from "next";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";

import { getPublicProperties, GetPropertiesOptions } from "@/lib/services/properties";
import { publicPropertyFilterSchema } from "@/features/public/schema";

export const dynamic = "force-dynamic";

function parseSearchParamsToOptions(searchParams: any): GetPropertiesOptions {
  const rawParams: Record<string, any> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value !== 'string') return;

    if (key === "ids") {
      rawParams[key] = value.split(",").filter(v => v.trim().length > 0);
    } else if (key === "near_train") {
      rawParams["nearTrain"] = value === "true";
    } else if (key === "pet_friendly") {
      rawParams["petFriendly"] = value === "true";
    } else if (key === "fully_furnished") {
      rawParams["fullyFurnished"] = value === "true";
    } else if (key === "foreigner") {
      rawParams["isForeigner"] = value === "true";
    } else if (key === "company_registered") {
      rawParams["companyRegistered"] = value === "true";
    } else if (key === "hot_deal") {
      rawParams["filter"] = value === "true" ? "hot_deals" : "all";
    } else if (key === "min_price") {
      rawParams["minPrice"] = Number(value);
    } else if (key === "max_price") {
      rawParams["maxPrice"] = Number(value);
    } else if (key === "min_size") {
      rawParams["minSize"] = Number(value);
    } else if (key === "max_size") {
      rawParams["maxSize"] = Number(value);
    } else if (key === "bedrooms") {
      rawParams["bedrooms"] = value === "ALL" ? undefined : Number(value);
    } else if (key === "listing_type") {
      rawParams["listingType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "property_type") {
      rawParams["propertyType"] = value === "ALL" ? "ALL" : value.toUpperCase();
    } else if (key === "popular_area") {
      rawParams["popular_area"] = value === "ALL" ? undefined : value;
    } else if (key === "province") {
      rawParams["province"] = value === "ALL" ? undefined : value;
    } else if (key === "transit_station") {
      rawParams["transitStation"] = value;
    } else if (key === "keyword") {
      rawParams["q"] = value;
    } else {
      rawParams[key] = value;
    }
  });

  const parsed = publicPropertyFilterSchema.safeParse(rawParams);
  return parsed.success ? (parsed.data as GetPropertiesOptions) : { limit: 12 };
}

export async function generateMetadata(props: { searchParams: Promise<any> }): Promise<Metadata> {
  const { t } = await getServerTranslations();
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);
  
  // Call cached getPublicProperties (limiting to 1 since we only need to check if there are 0 results)
  const initialData = await getPublicProperties({ ...options, limit: 1 });
  const hasNoResults = initialData.properties.length === 0;

  return {
    title: t("metadata.search_title"),
    description: t("metadata.search_description"),
    ...(hasNoResults && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}

export default async function PublicPropertiesPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const options = parseSearchParamsToOptions(searchParams);
  
  // ⚡ Prefetch initial data on the server
  const initialData = await getPublicProperties({ ...options, limit: 60, includeFacets: true });

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 pt-(--nav-offset,0px) transition-[padding-top] duration-300 ease-in-out">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-4">
          <AppBreadcrumbs />
        </div>
        <PropertySearchPage initialProperties={initialData.properties} initialFacets={initialData.facets} />
      </div>
    </>
  );
}
