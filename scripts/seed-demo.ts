import { createAdminClient } from "../lib/supabase/admin";
import { encrypt } from "../lib/crypto";
import { PROPERTY_TYPE_DB_VALUE } from "../features/properties/labels";

type PropertyType = "CONDO" | "HOUSE" | "VILLA" | "TOWNHOME";
type LeadSource = "FACEBOOK" | "WEBSITE" | "LINE" | "REFERRAL" | "PORTAL";
type LeadStage = "NEW" | "CONTACTED" | "VIEWED" | "NEGOTIATING" | "CLOSED";

async function seedDemoData() {
  const supabase = createAdminClient();

  console.log("🚀 Starting Demo Data Seeding (V3 Greenfield)...");

  // 1. Find a Tenant and Admin Profile
  const { data: memberData, error: memberError } = await supabase
    .from("tenant_members_v3")
    .select("tenant_id, identity_id")
    .limit(1)
    .single();

  if (memberError || !memberData) {
    console.error("❌ No tenant members found in tenant_members_v3 to seed data into.");
    return;
  }

  const tenant_id = memberData.tenant_id;
  const profile_id = memberData.identity_id;
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
  const insertedPropIds: string[] = [];
  let propsCount = 0;
  
  for (let i = 1; i <= 25; i++) {
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const district = districts[province][Math.floor(Math.random() * districts[province].length)];
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const isSale = Math.random() > 0.3;
    const isRent = Math.random() > 0.4;
    
    const price = isSale ? (Math.floor(Math.random() * 20) + 2) * 1000000 : null;
    const rentalPrice = isRent ? (Math.floor(Math.random() * 50) + 15) * 1000 : null;
    
    const isHotDeal = Math.random() > 0.7;
    const originalPrice = isHotDeal && price ? price * 1.15 : null;
    const originalRentalPrice = isHotDeal && rentalPrice ? rentalPrice * 1.2 : null;

    // Insert into properties_core (removed province, district, subdistrict, tenant_id)
    const { data: core, error: coreErr } = await supabase
      .from("properties_core")
      .insert({
        assigned_to: profile_id,
        created_by: profile_id,
        property_type: PROPERTY_TYPE_DB_VALUE[type],
        status: 1, // ACTIVE
        listing_type: isSale && isRent ? 2 : isSale ? 0 : 1,
        sale_price: price,
        rent_price: rentalPrice,
        floor_area: Math.floor(Math.random() * 100) + 30,
        bedrooms: Math.floor(Math.random() * 4) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        slug: `demo-property-${tenant_id?.slice(0, 4)}-${Date.now()}-${i}`,
      })
      .select("id")
      .single();

    if (coreErr || !core) {
      console.error(`❌ Error inserting property core #${i}:`, coreErr);
      continue;
    }

    // Insert into properties_details (changed 'id' to 'property_id')
    // Added address_info with province, district, subdistrict
    const { error: detailsErr } = await supabase
      .from("properties_details")
      .insert({
        property_id: core.id,
        title: { th: `Project ${type} at ${district} #${i}`, en: `Elite ${type} in ${district} #${i}` },
        description: { th: `บ้าน/คอนโด คุณภาพเยี่ยม ในทำเลศักยภาพ ${district} เดินทางสะดวก พร้อมสิ่งอำนวยความสะดวกครบครัน`, en: `Excellent quality property in prime location ${district}.` },
        address_info: {
          province,
          district,
          subdistrict: "แขวง/ตำบล ตัวอย่าง",
        },
        pricing_details: {
          original_price: originalPrice,
          original_rental_price: originalRentalPrice,
        },
        meta_data: {
          meta_keywords: isHotDeal ? ["Hot Deal", "Investment"] : ["Luxury", "Family"],
        }
      });

    if (detailsErr) {
      console.error(`❌ Error inserting property details #${i}:`, detailsErr);
      await supabase.from("properties_core").delete().eq("id", core.id);
    } else {
      insertedPropIds.push(core.id);
      propsCount++;
    }
  }

  console.log(`✅ Seeded ${propsCount} properties.`);

  // 4. Generate 60 Leads
  console.log("👥 Generating 60 leads...");
  let leadsCount = 0;

  for (let i = 1; i <= 60; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const source = leadSources[Math.floor(Math.random() * leadSources.length)];
    const stage = leadStages[Math.floor(Math.random() * leadStages.length)];
    
    // 1. Create identity_v3
    const identityId = crypto.randomUUID();
    const { error: identErr } = await supabase
      .from("identities_v3")
      .insert({
        id: identityId,
        display_name: encrypt(fullName),
        email: encrypt(`${firstName.slice(0, 3)}${i}@example.com`),
        phone: encrypt(`08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`),
      });

    if (identErr) {
      console.error(`❌ Error inserting identity for lead #${i}:`, identErr);
      continue;
    }

    // 2. Create tenant member with role = 'LEAD'
    await supabase
      .from("tenant_members_v3")
      .insert({
        tenant_id,
        identity_id: identityId,
        role: "LEAD",
      });

    // 3. Create crm_leads_v3
    // Changed: removed 'property_id', changed 'id' to use auto-generated, added 'identity_id'
    const { error: leadErr } = await supabase
      .from("crm_leads_v3")
      .insert({
        identity_id: identityId, // Required field
        tenant_id,
        assigned_to: profile_id,
        source,
        stage,
        ai_score: Math.floor(Math.random() * 100),
        ai_summary: `Demo Lead #${i} interested in ${source}`,
      });

    if (leadErr) {
      console.error(`❌ Error inserting crm_lead #${i}:`, leadErr);
    } else {
      leadsCount++;
    }
  }

  console.log(`✅ Seeded ${leadsCount} leads.`);
  console.log("✨ Seeding Complete!");
}

seedDemoData().catch(console.error);