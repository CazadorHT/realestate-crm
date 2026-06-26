import { config } from "dotenv";
import { resolve } from "path";

// Load dotenv
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";

const MISSING_STATIONS = [
  {
    code: "mrt_yellow_phawana",
    label: {
      th: "ภาวนา",
      en: "Phawana",
      cn: "帕瓦纳",
      ru: "Пхавана"
    },
    sort_order: 441,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-phawana"
    }
  },
  {
    code: "mrt_yellow_lat_phrao_71",
    label: {
      th: "ลาดพร้าว 71",
      en: "Lat Phrao 71",
      cn: "拉差达 71",
      ru: "Латпхрау 71"
    },
    sort_order: 443,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-lat-phrao-71"
    }
  },
  {
    code: "mrt_yellow_lat_phrao_83",
    label: {
      th: "ลาดพร้าว 83",
      en: "Lat Phrao 83",
      cn: "拉差达 83",
      ru: "Латпхрау 83"
    },
    sort_order: 445,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-lat-phrao-83"
    }
  },
  {
    code: "mrt_yellow_mahadthai",
    label: {
      th: "มหาดไทย",
      en: "Mahadthai",
      cn: "玛哈泰",
      ru: "Махадтхаи"
    },
    sort_order: 445,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-mahadthai"
    }
  },
  {
    code: "mrt_yellow_lat_phrao_101",
    label: {
      th: "ลาดพร้าว 101",
      en: "Lat Phrao 101",
      cn: "拉差达 101",
      ru: "Латпхрау 101"
    },
    sort_order: 445,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-lat-phrao-101"
    }
  },
  {
    code: "mrt_yellow_si_kritha",
    label: {
      th: "ศรีกรีฑา",
      en: "Si Kritha",
      cn: "诗吉里塔",
      ru: "Шрикритха"
    },
    sort_order: 446,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-si-kritha"
    }
  },
  {
    code: "mrt_yellow_si_udom",
    label: {
      th: "ศรีอุดม",
      en: "Si Udom",
      cn: "诗乌东",
      ru: "Шри Удом"
    },
    sort_order: 453,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-si-udom"
    }
  },
  {
    code: "mrt_yellow_si_bearing",
    label: {
      th: "ศรีแบริ่ง",
      en: "Si Bearing",
      cn: "诗轴承",
      ru: "Шри Беринг"
    },
    sort_order: 456,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-si-bearing"
    }
  },
  {
    code: "mrt_yellow_si_thepha",
    label: {
      th: "ศรีเทพา",
      en: "Si Thepha",
      cn: "诗特帕",
      ru: "Шри Тхепха"
    },
    sort_order: 457,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-si-thepha"
    }
  },
  {
    code: "mrt_yellow_thipphawan",
    label: {
      th: "ทิพวัล",
      en: "Thipphawan",
      cn: "提帕湾",
      ru: "Тхиппхаван"
    },
    sort_order: 457,
    metadata: {
      transit_type: "MRT_YELLOW",
      slug: "mrt-yellow-thipphawan"
    }
  }
];

async function seed() {
  const supabase = createAdminClient();
  console.log("Seeding missing MRT Yellow Line stations...");

  for (const station of MISSING_STATIONS) {
    const { data, error } = await supabase
      .from("ref_master_data")
      .upsert({
        type: "TRANSIT_STATION",
        code: station.code,
        label: station.label,
        is_active: true,
        sort_order: station.sort_order,
        metadata: station.metadata
      }, { onConflict: "type,code" })
      .select();

    if (error) {
      console.error(`Error seeding ${station.code}:`, error.message);
    } else {
      console.log(`Successfully seeded ${station.code} (slug: ${station.metadata.slug})`);
    }
  }

  console.log("Done seeding!");
}

seed().catch(console.error);
