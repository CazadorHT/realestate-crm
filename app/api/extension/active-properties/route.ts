import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import {
  getListingTypeFromDb,
  getPropertyTypeFromDb,
  PROPERTY_STATUS_DB_VALUE,
} from "@/features/properties/labels";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const expectedToken = process.env.VCC_EXTENSION_API_TOKEN?.trim();
  if (expectedToken) {
    const authHeader = req.headers.get("authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: กรุณาตั้งค่า Extension API Token ในแท็บ CRM" },
        { status: 401, headers: CORS_HEADERS },
      );
    }
  }

  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 50), 80);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("properties_core")
      .select(
        `
        id,
        slug,
        status,
        listing_type,
        property_type,
        sale_price,
        rent_price,
        bedrooms,
        bathrooms,
        floor_area,
        land_area,
        updated_at,
        properties_details (
          title,
          description,
          address_info,
          meta_data
        ),
        property_images (
          image_url,
          storage_path,
          is_cover,
          sort_order
        )
      `,
      )
      .eq("status", PROPERTY_STATUS_DB_VALUE.ACTIVE)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://vccasset.com").replace(/\/+$/, "");

    const properties = (data || [])
      .map((row: Record<string, unknown>) => {
        const detailsRaw = Array.isArray(row.properties_details)
          ? row.properties_details[0]
          : row.properties_details;
        const details = (detailsRaw || {}) as {
          title?: { th?: string; en?: string } | string;
          description?: { th?: string; en?: string } | string;
          address_info?: {
            province?: string;
            district?: string;
            subdistrict?: string;
            popular_area?: string;
          };
          meta_data?: { slug?: string };
        };

        const titleTh =
          typeof details.title === "string"
            ? details.title
            : details.title?.th || details.title?.en || "ทรัพย์ VCC Asset";
        const titleEn =
          typeof details.title === "object" && details.title ? details.title.en || "" : "";
        const descRaw =
          typeof details.description === "string"
            ? details.description
            : details.description?.th || details.description?.en || "";

        const rawImages = (Array.isArray(row.property_images) ? row.property_images : []) as Array<{
          image_url?: string | null;
          storage_path?: string | null;
          is_cover?: boolean | null;
          sort_order?: number | null;
        }>;

        const sortedImages = [...rawImages].sort((a, b) => {
          if (a.is_cover && !b.is_cover) return -1;
          if (!a.is_cover && b.is_cover) return 1;
          return (a.sort_order ?? 999) - (b.sort_order ?? 999);
        });

        const images = sortedImages
          .map((img) => {
            if (img.image_url && /^https?:\/\//i.test(img.image_url)) return img.image_url;
            if (img.storage_path) {
              return getPublicImageUrl(img.storage_path);
            }
            return null;
          })
          .filter((u): u is string => Boolean(u));

        const salePrice = row.sale_price ? Number(row.sale_price) : null;
        const rentPrice = row.rent_price ? Number(row.rent_price) : null;
        const listingType =
          getListingTypeFromDb(row.listing_type as number) ||
          (salePrice && rentPrice ? "SALE_AND_RENT" : salePrice ? "SALE" : "RENT");

        const propertyType = getPropertyTypeFromDb(row.property_type as number) || "CONDO";

        const slug = String(row.slug || details.meta_data?.slug || row.id);

        return {
          id: String(row.id),
          title: titleTh,
          titleEn,
          description: stripHtml(descRaw),
          listingType,
          propertyType,
          salePrice,
          rentPrice,
          bedrooms: row.bedrooms ? Number(row.bedrooms) : null,
          bathrooms: row.bathrooms ? Number(row.bathrooms) : null,
          sizeSqm: row.floor_area ? Number(row.floor_area) : null,
          district: details.address_info?.district || "",
          province: details.address_info?.province || "",
          popularArea: details.address_info?.popular_area || "",
          images,
          publicUrl: `${siteUrl}/properties/${slug}`,
          updatedAt: String(row.updated_at || ""),
        };
      })
      .filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.district.toLowerCase().includes(q) ||
          item.popularArea.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      });

    // Also fetch recently closed (SOLD/RENTED/ARCHIVED) property IDs for Phase 3 Lead Recycle alerts
    const { data: closedRows } = await supabase
      .from("properties_core")
      .select("id")
      .in("status", [
        PROPERTY_STATUS_DB_VALUE.SOLD,
        PROPERTY_STATUS_DB_VALUE.RENTED,
        PROPERTY_STATUS_DB_VALUE.ARCHIVED,
      ])
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200);

    const closedPropertyIds = (closedRows || []).map((r: { id: string }) => String(r.id));

    return NextResponse.json(
      { ok: true, properties, closedPropertyIds },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[ActiveProperties] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to load active properties" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
