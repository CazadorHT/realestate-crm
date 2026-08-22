import { createAdminClient } from "../lib/supabase/admin";
import { encrypt } from "../lib/crypto";
import { PROPERTY_TYPE_DB_VALUE } from "../features/properties/labels";

type PropertyType = "CONDO" | "HOUSE" | "VILLA" | "TOWNHOME";
type LeadSource = "FACEBOOK" | "WEBSITE" | "LINE" | "REFERRAL" | "PORTAL";
type LeadStage = "NEW" | "CONTACTED" | "VIEWED" | "NEGOTIATING" | "CLOSED";

async function setupSandboxDemo() {
  const supabase = createAdminClient();
  console.log("🚀 Starting Sandbox Demo Tenant & User Setup...");

  // 1. Create or Get Demo Tenant
  const DEMO_TENANT_ID = "d3a00000-0000-4000-a000-000000000001";
  const { data: existingTenant } = await supabase
    .from("tenants_v3")
    .select("id, name")
    .eq("id", DEMO_TENANT_ID)
    .maybeSingle();

  let demoTenantId = existingTenant?.id;

  if (!existingTenant) {
    console.log("🏢 Creating new Demo Tenant 'VCC Sandbox Demo Agency'...");
    const { data: newTenant, error: tenantErr } = await supabase
      .from("tenants_v3")
      .insert({
        id: DEMO_TENANT_ID,
        name: "VCC Sandbox Demo Agency",
        slug: "sandbox-demo",
        is_deleted: false,
      })
      .select("id")
      .single();

    if (tenantErr) {
      console.error("❌ Failed to create demo tenant:", tenantErr);
      return;
    }
    demoTenantId = newTenant.id;
    console.log("✅ Demo Tenant created with ID:", demoTenantId);
  } else {
    console.log("ℹ️ Demo Tenant already exists:", existingTenant.name);
  }

  // 2. Create or Get Demo User in Supabase Auth
  const email = "demo@vccasset.com";
  const password = "Demo2026!";

  const { data: { users }, error: listUsersErr } = await supabase.auth.admin.listUsers();
  if (listUsersErr) {
    console.error("❌ Error listing users:", listUsersErr);
    return;
  }

  let demoUserId = users?.find((u) => u.email === email)?.id;

  if (!demoUserId) {
    console.log("👤 Creating demo user in Supabase Auth:", email);
    const { data: newUser, error: createUserErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Demo Director (Buyer Sandbox)",
        role: "BRANCH_MANAGER",
      },
      app_metadata: {
        role: "BRANCH_MANAGER",
        tenant_id: demoTenantId,
      },
    });

    if (createUserErr || !newUser?.user) {
      console.error("❌ Failed to create demo user in Auth:", createUserErr);
      return;
    }
    demoUserId = newUser.user.id;
    console.log("✅ Demo user created with ID:", demoUserId);
  } else {
    console.log("🔄 Updating existing demo user password & metadata...");
    await supabase.auth.admin.updateUserById(demoUserId, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Demo Director (Buyer Sandbox)",
        role: "BRANCH_MANAGER",
      },
      app_metadata: {
        role: "BRANCH_MANAGER",
        tenant_id: demoTenantId,
      },
    });
  }

  // 3. Ensure identity in identities_v3
  const { data: existingIdent } = await supabase
    .from("identities_v3")
    .select("id")
    .eq("id", demoUserId)
    .maybeSingle();

  if (!existingIdent) {
    console.log("🆔 Creating identity record for demo user...");
    await supabase.from("identities_v3").insert({
      id: demoUserId,
      display_name: "Demo Director",
      email: email,
      role: "BRANCH_MANAGER",
      category: 1,
      is_active: true,
    });
  } else {
    await supabase
      .from("identities_v3")
      .update({
        display_name: "Demo Director",
        role: "BRANCH_MANAGER",
        is_active: true,
      })
      .eq("id", demoUserId);
  }

  if (!demoTenantId) {
    console.error("❌ No demoTenantId found");
    return;
  }

  // 4. Ensure tenant_members_v3 membership
  const { data: existingMember } = await supabase
    .from("tenant_members_v3")
    .select("id")
    .eq("tenant_id", demoTenantId)
    .eq("identity_id", demoUserId)
    .maybeSingle();

  if (!existingMember) {
    console.log("🔗 Linking demo user to Demo Tenant in tenant_members_v3...");
    await supabase.from("tenant_members_v3").insert({
      tenant_id: demoTenantId,
      identity_id: demoUserId,
      role: "BRANCH_MANAGER",
    });
  }

  // 5. Seed Sandboxed Demo Properties (20 listings)
  console.log("🏠 Seeding 20 Sandbox Demo Properties...");
  const provinces = ["กรุงเทพมหานคร", "ภูเก็ต", "ชลบุรี"];
  const districts: Record<string, string[]> = {
    "กรุงเทพมหานคร": ["วัฒนา", "คลองเตย", "ห้วยขวาง", "ปทุมวัน", "บางรัก"],
    "ภูเก็ต": ["กะทู้", "ถลาง", "เมืองภูเก็ต"],
    "ชลบุรี": ["พัทยา", "บางละมุง", "สัตหีบ"],
  };
  const propertyTypes: PropertyType[] = ["CONDO", "HOUSE", "VILLA", "TOWNHOME"];
  const titles = [
    "Luxury Penthouse with Skyline View",
    "Ultra-Modern Pool Villa near the Beach",
    "Prime Sukhumvit 2-Bedroom Condo next to BTS",
    "Executive Family Home in Gated Community",
    "Contemporary Riverfront Residence",
  ];

  let propCount = 0;
  for (let i = 1; i <= 20; i++) {
    const province = provinces[i % provinces.length];
    const districtList = districts[province];
    const district = districtList[i % districtList.length];
    const type = propertyTypes[i % propertyTypes.length];
    const isSale = i % 2 === 0;
    const isRent = i % 3 === 0;
    const titleSample = titles[i % titles.length];

    const salePrice = isSale ? (5 + (i * 2)) * 1000000 : null;
    const rentPrice = isRent ? (25 + (i * 5)) * 1000 : null;

    const { data: core, error: coreErr } = await supabase
      .from("properties_core")
      .insert({
        assigned_to: demoUserId,
        created_by: demoUserId,
        property_type: PROPERTY_TYPE_DB_VALUE[type],
        status: 1, // ACTIVE
        listing_type: isSale && isRent ? 2 : isSale ? 0 : 1,
        sale_price: salePrice,
        rent_price: rentPrice,
        floor_area: 45 + (i * 10),
        bedrooms: (i % 4) + 1,
        bathrooms: (i % 3) + 1,
        slug: `demo-sandbox-${i}-${Date.now().toString().slice(-4)}`,
      })
      .select("id")
      .single();

    if (coreErr || !core) {
      console.error(`❌ Error inserting demo sandbox property #${i}:`, coreErr);
      continue;
    }

    await supabase.from("properties_details").insert({
      property_id: core.id,
      title: {
        th: `[Demo Sandbox] ${titleSample} #${i}`,
        en: `[Demo Sandbox] ${titleSample} #${i}`,
      },
      description: {
        th: `ยูนิตตัวอย่างสำหรับทดสอบระบบ CRM ฟังก์ชันครบครัน ตกแต่งพร้อมอยู่ ใกล้รถไฟฟ้าและสิ่งอำนวยความสะดวก`,
        en: `High-end sandbox demo property unit for CRM buyer evaluation. Fully furnished, prime location.`,
      },
      address_info: {
        province,
        district,
        subdistrict: "แขวงตัวอย่าง",
      },
      pricing_details: {
        original_price: salePrice ? salePrice * 1.1 : null,
        original_rental_price: rentPrice ? rentPrice * 1.15 : null,
      },
      meta_data: {
        is_demo: true,
        tenant_id: demoTenantId,
        meta_keywords: ["Hot Deal", "Sandbox Demo", "Investment"],
      },
    });

    propCount++;
  }
  console.log(`✅ Successfully seeded ${propCount} sandbox demo properties.`);

  // 6. Seed Sandboxed Demo Leads (30 leads)
  console.log("👥 Seeding 30 Sandbox Demo Leads...");
  const leadSources: LeadSource[] = ["FACEBOOK", "WEBSITE", "LINE", "REFERRAL", "PORTAL"];
  const leadStages: LeadStage[] = ["NEW", "CONTACTED", "VIEWED", "NEGOTIATING", "CLOSED"];
  const names = [
    "Alexander Wright", "Sarah Jenkins", "Michael Chen", "Emily Davis", "David Miller",
    "สมชาย วัฒนากุล", "ณิชาภัทร เลิศรัตนชัย", "กฤษฎา พงศ์สิริ", "ธนกร อัศวเสนา", "วิภาวี มงคลสุข"
  ];

  let leadCount = 0;
  for (let i = 1; i <= 30; i++) {
    const fullName = names[i % names.length] + ` (Demo #${i})`;
    const source = leadSources[i % leadSources.length];
    const stage = leadStages[i % leadStages.length];

    const leadIdentId = crypto.randomUUID();
    await supabase.from("identities_v3").insert({
      id: leadIdentId,
      display_name: encrypt(fullName),
      email: encrypt(`buyer.demo.${i}@sandbox.com`),
      phone: encrypt(`08912345${(i % 100).toString().padStart(2, "0")}`),
    });

    await supabase.from("tenant_members_v3").insert({
      tenant_id: demoTenantId,
      identity_id: leadIdentId,
      role: "LEAD",
    });

    await supabase.from("crm_leads_v3").insert({
      identity_id: leadIdentId,
      tenant_id: demoTenantId,
      assigned_to: demoUserId,
      source,
      stage,
      ai_score: 65 + (i % 35),
      ai_summary: `[Demo Sandbox Lead #${i}] Interested in ${source} property inquiries. High intent buyer.`,
    });

    leadCount++;
  }
  console.log(`✅ Successfully seeded ${leadCount} sandbox demo leads.`);

  console.log("\n🎉 ========================================================");
  console.log("✨ Sandbox Demo Environment Setup Completed Successfully!");
  console.log(`🏢 Tenant Name: VCC Sandbox Demo Agency (ID: ${demoTenantId})`);
  console.log(`🔑 Demo Login Email: ${email}`);
  console.log(`🔒 Demo Login Password: ${password}`);
  console.log("========================================================\n");
}

setupSandboxDemo().catch(console.error);
