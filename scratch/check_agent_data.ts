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
    console.log("=== PROPERTIES WITH profiles RELATIONSHIP ===");
    console.dir(properties, { depth: null });
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
