import { createAdminClient } from "../lib/supabase/admin";

async function check() {
  const supabase = createAdminClient();
  
  // Get one property with agents
  const { data: properties, error } = await supabase
    .from("properties")
    .select(`
      id,
      title,
      property_agents (
        agent_id,
        profiles:identities_v3 (
          full_name:display_name,
          phone,
          line_id
        )
      )
    `)
    .limit(5);

  if (error) {
    console.error("Error fetching properties with profiles relationship:", error);
  } else {
    const propertyList = properties as any[];
    for (const property of propertyList) {
      if (property && property.property_agents) {
        for (const pa of property.property_agents) {
          console.log(`Checking pa for property ${property.id}:`, pa);
          if (pa.agent_id) {
            const { data: staffProfile } = await supabase
              .from("profiles")
              .select("full_name, phone, line_id")
              .eq("id", pa.agent_id)
              .maybeSingle();

            console.log(`Fetched staffProfile for agent_id ${pa.agent_id}:`, staffProfile);

            if (staffProfile) {
              pa.profiles = {
                ...pa.profiles,
                full_name: staffProfile.full_name || pa.profiles?.full_name || "",
                phone: staffProfile.phone || pa.profiles?.phone || "",
                line_id: staffProfile.line_id || pa.profiles?.line_id || "",
              };
            }
          }
        }
      }
    }
    console.log("=== PROPERTIES AFTER FALLBACK AND DECRYPTION ===");
    console.dir(propertyList, { depth: null });
  }

  // Query public.identities_v3 directly for the specific agent ID
  const { data: rawIdentity, error: error5 } = await supabase
    .from("identities_v3")
    .select("*")
    .eq("id", "d30bd3b8-f1b9-4186-b4f5-2cba5b6aa283")
    .single();

  if (error5) {
    console.error("Error fetching identities_v3:", error5);
  } else {
    console.log("=== PUBLIC.IDENTITIES_V3 FOR AGENT ===");
    console.dir(rawIdentity, { depth: null });
  }
}

check();
