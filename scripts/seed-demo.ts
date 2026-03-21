import { createAdminClient } from "../lib/supabase/admin";
import { Database } from "../lib/database.types";

type PropertyType = Database["public"]["Enums"]["property_type"];
type LeadSource = Database["public"]["Enums"]["lead_source"];
type LeadStage = Database["public"]["Enums"]["lead_stage"];

async function seedDemoData() {
  const supabase = createAdminClient();

  console.log("🚀 Starting Demo Data Seeding...");

  // 1. Find a Tenant and Admin Profile
  const { data: memberData, error: memberError } = await supabase
    .from("tenant_members")
    .select("tenant_id, profile_id")
    .limit(1)
    .single();

  if (memberError || !memberData) {
    console.error("❌ No tenant members found to seed data into.");
    return;
  }

  const { tenant_id, profile_id } = memberData;
  console.log(`📍 Seeding for Tenant: ${tenant_id}, Assigned to Profile: ${profile_id}`);

  // 2. Sample Data Sets
  const provinces = ["กรุงเทพมหานคร", "ภูเก็ต", "ชลบุรี"];
  const districts: Record<string, string[]> = {
    "กรุงเทพมหานคร": ["วัฒนา", "คลองเตย", "ห้วยขวาง", "ปทุมวัน", "บางรัก"],
    "ภูเก็ต": ["กะทู้", "ถลาง", "เมืองภูเก็ต"],
    "ชลบุรี": ["พัทยา", "บางละมุง", "สัตหีบ"],
  };

  const propertyTypes: PropertyType[] = ["CONDO", "HOUSE", "VILLA", "TOWNHOME"];
  const leadSources: LeadSource[] = ["FACEBOOK", "WEBSITE", "LINE", "REFERRAL", "PORTAL"];
  const leadStages: LeadStage[] = ["NEW", "CONTACTED", "VIEWED", "NEGOTIATING", "CLOSED"];

  const firstNames = ["สมชาย", "วิลัย", "อานนท์", "กัญญา", "ธนา", "ศิริ", "ประกิจ", "ณัฐธิดา", "ภาณุ", "จิรา"];
  const lastNames = ["รักดี", "มั่งคั่ง", "สายลม", "ใจงาม", "รุ่งเรือง", "แสงทอง", "พรอุดม", "วัฒนา", "ศรีสวัสดิ์", "ทวีสุข"];

  // 3. Generate 25 Properties
  console.log("🏠 Generating 25 properties...");
  const properties = [];
  for (let i = 1; i <= 25; i++) {
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const district = districts[province][Math.floor(Math.random() * districts[province].length)];
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const isSale = Math.random() > 0.3;
    const isRent = Math.random() > 0.4;
    
    const price = isSale ? (Math.floor(Math.random() * 20) + 2) * 1000000 : null;
    const rentalPrice = isRent ? (Math.floor(Math.random() * 50) + 15) * 1000 : null;
    
    // Add some "Hot Deals" (Original price higher)
    const isHotDeal = Math.random() > 0.7;
    const originalPrice = isHotDeal && price ? price * 1.15 : null;
    const originalRentalPrice = isHotDeal && rentalPrice ? rentalPrice * 1.2 : null;

    properties.push({
      tenant_id,
      assigned_to: profile_id,
      title: `Project ${type} at ${district} #${i}`,
      title_en: `Elite ${type} in ${district} #${i}`,
      description: `บ้าน/คอนโด คุณภาพเยี่ยม ในทำเลศักยภาพ ${district} เดินทางสะดวก พร้อมสิ่งอำนวยความสะดวกครบครัน`,
      property_type: type as PropertyType,
      status: "ACTIVE",
      listing_type: (isSale && isRent ? "SALE_AND_RENT" : (isSale ? "SALE" : "RENT")) as any,
      price,
      original_price: originalPrice,
      rental_price: rentalPrice,
      original_rental_price: originalRentalPrice,
      province,
      district,
      subdistrict: "แขวง/ตำบล ตัวอย่าง",
      size_sqm: Math.floor(Math.random() * 100) + 30,
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      slug: `demo-property-${tenant_id.slice(0,4)}-${Date.now()}-${i}`,
      meta_keywords: isHotDeal ? ["Hot Deal", "Investment"] : ["Luxury", "Family"],
    });
  }

  const { data: insertedProps, error: propError } = await supabase
    .from("properties")
    .insert(properties as any)
    .select("id");

  if (propError) {
    console.error("❌ Error inserting properties:", propError);
    return;
  }
  console.log(`✅ Inserted ${insertedProps.length} properties.`);

  // 4. Generate 60 Leads
  console.log("👥 Generating 60 leads...");
  const leads = [];
  const insertedPropIds = insertedProps.map(p => p.id);

  for (let i = 1; i <= 60; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const source = leadSources[Math.floor(Math.random() * leadSources.length)];
    const stage = leadStages[Math.floor(Math.random() * leadStages.length)];
    const propertyId = Math.random() > 0.5 ? insertedPropIds[Math.floor(Math.random() * insertedPropIds.length)] : null;
    
    leads.push({
      tenant_id,
      assigned_to: profile_id,
      full_name: fullName,
      email: `${firstName.slice(0,3)}${i}@example.com`,
      phone: `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      source,
      stage,
      property_id: propertyId,
      ai_score: Math.floor(Math.random() * 100),
      note: `Demo Lead #${i} interested in ${source}`,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  const { error: leadError } = await supabase
    .from("leads")
    .insert(leads);

  if (leadError) {
    console.error("❌ Error inserting leads:", leadError);
  } else {
    console.log("✅ Inserted 60 leads.");
  }

  console.log("✨ Seeding Complete!");
}

seedDemoData().catch(console.error);
