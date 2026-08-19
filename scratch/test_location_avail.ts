import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { getDistrictName } from "../lib/utils/provinces";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocations() {
  const [propsRes, popularAreasRes] = await Promise.all([
    supabase
      .from("properties")
      .select("district, popular_area, popular_area_en, popular_area_cn, popular_area_ru, price, original_price, rental_price, original_rental_price, rent_price_per_sqm, price_per_sqm, size_sqm, property_type, listing_type, status, deleted_at")
      .eq("status", "ACTIVE")
      .is("deleted_at", null),
    supabase
      .from("popular_areas_v3")
      .select("name, is_active")
  ]);

  const popularAreaMap = new Map<string, { en?: string | null; cn?: string | null; ru?: string | null }>();
  if (popularAreasRes.data) {
    popularAreasRes.data.forEach((row: any) => {
      const nameObj = row.name;
      if (nameObj && typeof nameObj === "object") {
        const th = nameObj.th || nameObj.name_th || "";
        if (th) {
          popularAreaMap.set(th.trim().toLowerCase(), {
            en: nameObj.en || nameObj.name_en || null,
            cn: nameObj.cn || nameObj.name_cn || null,
            ru: nameObj.ru || nameObj.name_ru || null,
          });
        }
      }
    });
  }

  const areaMap = new Map<string, any>();

  propsRes.data?.forEach((p: any) => {
    const popularArea = (p.popular_area as string | null)?.trim();
    if (popularArea) {
      if (!areaMap.has(popularArea)) {
        const v3Match = popularAreaMap.get(popularArea.toLowerCase());
        const cleanName = popularArea.replace(/^(เขต|อำเภอ|อ\.)/, "").trim();
        areaMap.set(popularArea, {
          name: popularArea,
          name_en: v3Match?.en || p.popular_area_en || getDistrictName(cleanName, "en") || popularArea,
          name_cn: v3Match?.cn || p.popular_area_cn || getDistrictName(cleanName, "cn") || popularArea,
          name_ru: v3Match?.ru || p.popular_area_ru || getDistrictName(cleanName, "ru") || popularArea,
        });
      }
    } else if (p.district) {
      const district = (p.district as string).trim();
      if (district && !areaMap.has(district)) {
        const cleanDistrict = district.replace(/^(เขต|อำเภอ|อ\.)/, "").trim();
        areaMap.set(district, {
          name: district,
          name_en: getDistrictName(district, "en") || cleanDistrict,
          name_cn: getDistrictName(district, "cn") || cleanDistrict,
          name_ru: getDistrictName(district, "ru") || cleanDistrict,
        });
      }
    }
  });

  console.log("Resolved Locations Count:", areaMap.size);
  console.log("Resolved Locations Sample:");
  console.log(Array.from(areaMap.values()));
}

testLocations().catch(console.error);
