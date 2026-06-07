import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { populateAgentProfiles, renderPropertySocialTemplate } from "../features/properties/actions/social";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const propertyId = "e2a20b0c-bfb5-4b13-a45b-048ffef32309"; // Q1 Sukhumvit condo
  console.log(`Getting property data directly for: ${propertyId}...`);
  
  try {
    const { data: propData, error: propError } = await supabase
      .from("properties")
      .select(`
        *,
        property_images ( image_url ),
        property_agents ( agent_id, profiles:identities_v3 ( full_name:display_name, phone, line_id ) ),
        property_features ( features ( name, name_en, name_cn, name_ru, icon_key ) )
      `)
      .eq("id", propertyId)
      .single();

    if (propError || !propData) {
      throw new Error(`Property not found: ${propError?.message}`);
    }

    const property = propData as any;
    console.log("Before populateAgentProfiles, agents:", property.property_agents);

    // Call our new helper function
    await populateAgentProfiles(supabase, property);

    console.log("After populateAgentProfiles, agents:", JSON.stringify(property.property_agents, null, 2));

    const template = "ชื่อตัวแทน: {{agent_name}} | 📞 โทร: {{agent_phone}} | 💬 Line ID: {{agent_line}}";
    console.log("Test Template:", template);

    const content = await renderPropertySocialTemplate(template, property, "th");
    console.log("\nGenerated Content Preview:\n----------------------------------------");
    console.log(content);
    console.log("----------------------------------------");

  } catch (error) {
    console.error("Error running test:", error);
  }
}

run();
