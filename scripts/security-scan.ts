import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Ensure .env has SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function scanAuditLogs() {
  console.log("🚀 Starting Security Audit Scan...");

  // 1. Check for bursts (Too many actions in a short window)
  console.log("\n📊 Checking for activity bursts (Last 24h)...");
  const { data: burstData, error: burstError } = await supabase
    .from("system_audit_logs_v3")
    .select("created_at, action, actor_id")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false });

  if (burstError) {
    console.error("Error fetching burst data:", burstError.message);
  } else {
    console.log(`Received ${burstData.length} records.`);
    
    // Group by minute to detect bursts
    const groups: Record<string, number> = {};
    burstData.forEach(log => {
      const minute = log.created_at.substring(0, 16); // YYYY-MM-DDTHH:mm
      groups[minute] = (groups[minute] || 0) + 1;
    });

    const bursts = Object.entries(groups).filter(([_, count]) => count > 20);
    if (bursts.length > 0) {
      console.warn("⚠️ Potential bursts detected:");
      bursts.forEach(([minute, count]) => {
        console.warn(`  - ${minute}: ${count} actions`);
      });
    } else {
      console.log("✅ No significant bursts detected (>20 req/min).");
    }
  }

  // 2. Check for Login Success Patterns
  console.log("\n🔐 Analyzing Login patterns...");
  const { data: loginData, error: loginError } = await supabase
    .from("system_audit_logs_v3")
    .select("created_at, new_data, actor_id")
    .eq("action", "LOGIN")
    .order("created_at", { ascending: false })
    .limit(50);

  if (loginError) {
    console.error("Error fetching login data:", loginError.message);
  } else {
    console.log(`Analyzed last ${loginData.length} successful logins.`);
    const loginIps: Record<string, number> = {};
    loginData.forEach(log => {
      const meta = log.new_data as any;
      const ip = meta?.ip || "unknown";
      loginIps[ip] = (loginIps[ip] || 0) + 1;
    });

    const frequentIps = Object.entries(loginIps).filter(([_, count]) => count > 5);
    if (frequentIps.length > 0) {
      console.warn("⚠️ Frequent Login IPs detected:");
      frequentIps.forEach(([ip, count]) => {
        console.warn(`  - ${ip}: ${count} logins`);
      });
    } else {
      console.log("✅ Login patterns look normal.");
    }
  }

  console.log("\n✅ Security Scan Completed.");
}

scanAuditLogs();
