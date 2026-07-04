import { createAdminClient } from "../lib/supabase/admin";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const supabase = createAdminClient();
  const { data: templates, error } = await supabase
    .from("contract_templates")
    .select("id, name, type, content");

  if (error) {
    console.error("Error fetching templates:", error);
    return;
  }

  for (const t of templates || []) {
    console.log("=========================================");
    console.log(`Template: ${t.name} (ID: ${t.id}, Type: ${t.type})`);
    console.log("=========================================");
    // Print first 500 chars or search for key variables
    console.log(t.content?.substring(0, 1000));
    const priceMatches = t.content?.match(/\{\{[^}]*price[^}]*\}\}/gi);
    const amountMatches = t.content?.match(/\{\{[^}]*amount[^}]*\}\}/gi);
    console.log("Price matches:", priceMatches);
    console.log("Amount matches:", amountMatches);
  }
}

main().catch(console.error);
