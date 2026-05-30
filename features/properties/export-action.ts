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
import { PropertyStatus, PropertyType, ListingType } from "./types";

const PROPERTY_COLUMNS: ExcelColumn[] = [
  { key: "id", header: "รหัสทรัพย์", width: 36 },
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
    key: "original_price",
    header: "ราคาขายตั้งต้น",
    width: 15,
    format: formatThaiCurrency,
  },
  {
    key: "rental_price",
    header: "ราคาเช่า/เดือน",
    width: 15,
    format: formatThaiCurrency,
  },
  {
    key: "original_rental_price",
    header: "ราคาเช่าตั้งต้น",
    width: 15,
    format: formatThaiCurrency,
  },
  { key: "bedrooms", header: "ห้องนอน", width: 10 },
  { key: "bathrooms", header: "ห้องน้ำ", width: 10 },
  { key: "size_sqm", header: "พื้นที่ (ตร.ม.)", width: 12 },
  { key: "land_size_sqwah", header: "พื้นที่ดิน (ตร.วา)", width: 15 },
  { key: "floor", header: "ชั้น", width: 8 },
  { key: "parking_slots", header: "ที่จอดรถ (คัน)", width: 12 },
  { key: "district", header: "เขต/อำเภอ", width: 15 },
  { key: "subdistrict", header: "แขวง/ตำบล", width: 15 },
  { key: "province", header: "จังหวัด", width: 15 },
  { key: "postal_code", header: "รหัสไปรษณีย์", width: 12 },
  { key: "address_line1", header: "ที่อยู่", width: 30 },
  { key: "google_maps_link", header: "ลิงก์ Google Maps", width: 30 },
  {
    key: "near_transit",
    header: "ใกล้รถไฟฟ้า",
    width: 12,
    format: formatBoolean,
  },
  { key: "transit_station_name", header: "สถานีรถไฟฟ้าใกล้เคียง", width: 20 },
  { key: "transit_distance_meters", header: "ระยะห่างจากสถานี (เมตร)", width: 22 },
  {
    key: "is_pet_friendly",
    header: "เลี้ยงสัตว์ได้",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_fully_furnished",
    header: "ตกแต่งครบ",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_corner_unit",
    header: "ห้องมุม",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_renovated",
    header: "รีโนเวทแล้ว",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_selling_with_tenant",
    header: "ขายพร้อมผู้เช่า",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_foreigner_quota",
    header: "โควตาต่างชาติ",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_hot_deal",
    header: "Hot Deal",
    width: 12,
    format: formatBoolean,
  },
  {
    key: "is_exclusive",
    header: "Exclusive Listing",
    width: 12,
    format: formatBoolean,
  },
  { key: "ceiling_height", header: "ความสูงเพดาน (ม.)", width: 15 },
  { key: "orientation", header: "ทิศทางหน้าต่าง/ระเบียง", width: 20 },
  { key: "parking_type", header: "ประเภทที่จอดรถ", width: 15 },
  { key: "co_agent_name", header: "ชื่อ Co-Agent", width: 20 },
  { key: "co_agent_phone", header: "เบอร์โทร Co-Agent", width: 18 },
  { key: "co_agent_sale_commission_percent", header: "ค่าคอม Co-Agent (%)", width: 20 },
  { key: "commission_sale_percentage", header: "ค่าคอมขาย (%)", width: 15 },
  { key: "commission_rent_months", header: "ค่าคอมเช่า (เดือน)", width: 18 },
  { key: "total_units", header: "ยูนิตทั้งหมด", width: 12 },
  { key: "sold_units", header: "ยูนิตขายแล้ว", width: 12 },
  { key: "view_count", header: "ยอดผู้ชม", width: 10 },
  { key: "property_source", header: "แหล่งที่มาทรัพย์", width: 18 },
  { key: "description", header: "รายละเอียด", width: 40 },
  {
    key: "created_at",
    header: "สร้างเมื่อ",
    width: 15,
    format: formatThaiDate,
  },
  {
    key: "updated_at",
    header: "แก้ไขล่าสุด",
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
    assignedToMe?: string;
  },
) {
  const ctx = await requireAuthContext();
  const { supabase, role, tenantId, user } = ctx;
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties")
    .select(`
      id, title, property_type, listing_type, status, price, original_price, 
      rental_price, original_rental_price, bedrooms, bathrooms, size_sqm, 
      land_size_sqwah, floor, parking_slots, district, subdistrict, province, 
      postal_code, address_line1, google_maps_link, near_transit, transit_station_name, 
      transit_distance_meters, is_pet_friendly, is_fully_furnished, is_corner_unit, 
      is_renovated, is_selling_with_tenant, is_foreigner_quota, is_hot_deal, is_exclusive, 
      ceiling_height, orientation, parking_type, co_agent_name, co_agent_phone, 
      co_agent_sale_commission_percent, commission_sale_percentage, commission_rent_months, 
      total_units, sold_units, view_count, property_source, description, created_at, updated_at, tenant_id
    `)
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
      assignedToMe,
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
      query = query.eq("status", status as PropertyStatus);
    }
    if (type && type !== "ALL") {
      query = query.eq("property_type", type as PropertyType);
    }
    if (listing && listing !== "ALL") {
      if (listing === "SALE") {
        query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
      } else if (listing === "RENT") {
        query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
      } else {
        query = query.eq("listing_type", listing as ListingType);
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
    if (assignedToMe === "true" && user?.id) {
      query = query.eq("assigned_to", user.id);
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
