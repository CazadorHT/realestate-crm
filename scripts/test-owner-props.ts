import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const ownerId = "b64af43a-a799-4629-9b87-43dba124ca4c";
  console.log("Checking owner:", ownerId);

  // 1. Check with projects join
  const { data: withProjects, error: errWithProjects } = await supabase
    .from("properties")
    .select("id, title, title_en, projects(name), project_id, owner_id")
    .eq("owner_id", ownerId);
  console.log("Query with projects:", { length: withProjects?.length, error: errWithProjects, data: withProjects });

  // 2. Check simple query
  const { data: simple, error: errSimple } = await supabase
    .from("properties")
    .select("id, title, title_en, owner_id")
    .eq("owner_id", ownerId);
  console.log("Query simple:", { length: simple?.length, error: errSimple, data: simple });
}

check().catch(console.error);
