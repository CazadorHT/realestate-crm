import fs from 'fs';
import path from 'path';
import { createClient } from "@supabase/supabase-js";

// Load .env file
const envPath = '/Users/hunter/Developer/realestate-crm/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase config not found in env:", { supabaseUrl, hasKey: !!supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("deals")
    .select("id, deal_type, properties(title), leads(full_name, email)");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Deals from DB:", JSON.stringify(data, null, 2));
}

check();
