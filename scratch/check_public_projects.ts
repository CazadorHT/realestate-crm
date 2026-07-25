import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function checkProjects() {
  const supabase = createAdminClient();
  const { data: projects } = await supabase.from("projects").select("id, name").eq("is_active", true);
  const { data: stats } = await supabase.from("mv_project_property_stats").select("*");
  console.log("Total active projects in DB:", projects?.length);
  console.log("Total projects with stats in MV:", stats?.length);
  console.log("Projects in MV:", stats);
}

checkProjects().catch(console.error);
