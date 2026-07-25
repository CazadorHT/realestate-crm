import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function checkProjects() {
  const supabase = createAdminClient();
  const { data: projects } = await supabase.from("projects").select("id, name").eq("is_active", true);
  const { data: stats } = await supabase.from("mv_project_property_stats").select("*");
  const { data: propsWithoutProject } = await supabase.from("properties").select("id, title, status, project_id").eq("status", "ACTIVE").is("deleted_at", null);
  
  const propsWithProj = propsWithoutProject?.filter(p => p.project_id) || [];
  const propsNoProj = propsWithoutProject?.filter(p => !p.project_id) || [];

  console.log("Total ACTIVE properties in DB:", propsWithoutProject?.length);
  console.log("ACTIVE properties LINKED to project:", propsWithProj.length);
  console.log("ACTIVE properties WITHOUT project:", propsNoProj.length);
  console.log("Total active projects in DB:", projects?.length);
  console.log("Total projects with active properties in MV:", stats?.length);
}

checkProjects().catch(console.error);
