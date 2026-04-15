"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  generateExcelBuffer,
  ExcelColumn,
  formatThaiCurrency,
  formatThaiDate,
  formatBoolean,
  formatListingType,
  formatPropertyStatus,
} from "@/lib/excel-export";
import { logAudit } from "@/lib/audit";
import { getSystemConfig } from "@/lib/actions/system-config";

const PROPERTY_COLUMNS: ExcelColumn[] = [
  { key: "title", header: "ชื่อทรัพย์", width: 30 },
  { key: "property_type", header: "ประเภท", width: 15 },
  {
    key: "listing_type",
    header: "ประเภทประกาศ",
    width: 12,
    format: formatListingType,
  },
  { key: "status", header: "สถานะ", width: 12, format: formatPropertyStatus },
  {
    key: "price",
    header: "ราคาขาย",
    width: 15,
    format: formatThaiCurrency,
  },
  {
    key: "rental_price",
    header: "ราคาเช่า/เดือน",
    width: 15,
    format: formatThaiCurrency,
  },
  { key: "bedrooms", header: "ห้องนอน", width: 10 },
  { key: "bathrooms", header: "ห้องน้ำ", width: 10 },
  { key: "size_sqm", header: "พื้นที่ (ตร.ม.)", width: 12 },
  { key: "district", header: "เขต/อำเภอ", width: 15 },
  { key: "subdistrict", header: "แขวง/ตำบล", width: 15 },
  { key: "province", header: "จังหวัด", width: 15 },
  {
    key: "is_near_train",
    header: "ใกล้รถไฟฟ้า",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_pet_friendly",
    header: "เลี้ยงสัตว์ได้",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "created_at",
    header: "สร้างเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
];

export async function exportPropertiesAction(
  ids?: string[],
  filters?: {
    q?: string;
    status?: string;
    type?: string;
    listing?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    province?: string;
    district?: string;
    popular_area?: string;
    sortBy?: string;
    sortOrder?: string;
    nearTransit?: string;
    petFriendly?: string;
    fullyFurnished?: string;
    allBranches?: string;
  },
) {
  const ctx = await requireAuthContext();
  const { supabase, role, tenantId } = ctx;
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties")
    .select("*")
    .is("deleted_at", null);

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  } else if (filters) {
    const {
      q,
      status,
      type,
      listing,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      province,
      district,
      popular_area,
      sortBy = "created_at",
      sortOrder = "desc",
      nearTransit,
      petFriendly,
      fullyFurnished,
      allBranches,
    } = filters;

    if (isMultiTenant) {
      if (allBranches === "true" || tenantId === "ALL" || !tenantId) {
        // ALL
      } else {
        query = query.eq("tenant_id", tenantId);
      }
    }

    if (q && q.trim()) {
      const isHexFragment = /^[0-9a-fA-F-]{4,}$/.test(q);
      const conditions = [
        `title.ilike.%${q}%`,
        `description.ilike.%${q}%`,
        `address_line1.ilike.%${q}%`,
      ];
      if (isHexFragment) {
        conditions.unshift(`id.ilike.%${q}%`);
      }
      query = query.or(conditions.join(","));
    }

    if (status && status !== "ALL") {
      query = query.eq("status", status as any);
    }
    if (type && type !== "ALL") {
      query = query.eq("property_type", type as any);
    }
    if (listing && listing !== "ALL") {
      if (listing === "SALE") {
        query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
      } else if (listing === "RENT") {
        query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
      } else {
        query = query.eq("listing_type", listing as any);
      }
    }
    if (bedrooms) {
      query = query.eq("bedrooms", Number(bedrooms));
    }
    if (bathrooms) {
      query = query.eq("bathrooms", Number(bathrooms));
    }
    if (province) {
      query = query.ilike("province", `%${province}%`);
    }
    if (district) {
      query = query.ilike("district", `%${district}%`);
    }
    if (popular_area) {
      query = query.ilike("popular_area", `%${popular_area}%`);
    }
    if (nearTransit === "true") {
      query = query.eq("near_transit", true);
    }
    if (petFriendly === "true") {
      query = query.eq("is_pet_friendly", true);
    }
    if (fullyFurnished === "true") {
      query = query.eq("is_fully_furnished", true);
    }

    // Price Range
    const priceField = listing === "RENT" ? "rental_price" : "price";
    const fallbackField = listing === "RENT" ? "original_rental_price" : "original_price";
    if ((minPrice && minPrice.trim() !== "") || (maxPrice && maxPrice.trim() !== "")) {
      const min = minPrice && minPrice.trim() !== "" ? Number(minPrice) : 0;
      const maxStr = maxPrice && maxPrice.trim() !== "" ? maxPrice : null;
      if (maxStr !== null) {
        const max = Number(maxStr);
        query = query.or(`and(${priceField}.gte.${min},${priceField}.lte.${max}),and(${priceField}.is.null,${fallbackField}.gte.${min},${fallbackField}.lte.${max})`);
      } else {
        query = query.or(`${priceField}.gte.${min},and(${priceField}.is.null,${fallbackField}.gte.${min})`);
      }
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });
  } else {
    // Default: all sorted by created_at
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, message: "ไม่พบข้อมูลสำหรับ export" };
  }

  const buffer = await generateExcelBuffer(
    data,
    PROPERTY_COLUMNS,
    "Properties",
  );
  const base64 = buffer.toString("base64");

  // Log Audit
  await logAudit(ctx, {
    action: "property.export",
    entity: "property",
    metadata: {
      count: data.length,
      is_filtered: !!filters,
      is_bulk: !!ids,
      filter_summary: filters ? JSON.stringify(filters) : undefined,
    },
  });

  return {
    success: true,
    data: base64,
    filename: `properties_${new Date().toISOString().slice(0, 10)}.xlsx`,
    count: data.length,
  };
}
