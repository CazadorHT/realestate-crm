import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const uuid = "1c477f40-d03d-41c4-818c-f276043f3b01";
  
  console.log("Starting tests...");

  try {
    const test1 = await supabase.rpc("increment_property_view", { property_id: uuid });
    console.log("Test with { property_id }:", test1.error?.message || "Success");
  } catch (e: any) {
    console.log("Test with { property_id } caught error:", e.message);
  }

  try {
    const test2 = await supabase.rpc("increment_property_view", { p_id: uuid });
    console.log("Test with { p_id }:", test2.error?.message || "Success");
  } catch (e: any) {
    console.log("Test with { p_id } caught error:", e.message);
  }

  try {
    const test3 = await supabase.rpc("increment_property_view", { p_property_id: uuid });
    console.log("Test with { p_property_id }:", test3.error?.message || "Success");
  } catch (e: any) {
    console.log("Test with { p_property_id } caught error:", e.message);
  }

  try {
    const test4 = await supabase.rpc("increment_property_view", { id: uuid });
    console.log("Test with { id }:", test4.error?.message || "Success");
  } catch (e: any) {
    console.log("Test with { id } caught error:", e.message);
  }

  try {
    const test5 = await supabase.rpc("increment_property_view", { property_id: uuid, user_id: null, visitor_id: null });
    console.log("Test with { property_id, user_id, visitor_id }:", test5.error?.message || "Success");
  } catch (e: any) {
    console.log("Test with { property_id, user_id, visitor_id } caught error:", e.message);
  }
}

run().catch(console.error);
