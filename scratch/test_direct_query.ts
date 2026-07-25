import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function test() {
  const supabase = createAdminClient();

  // Query properties as getPublicProperties does:
  let query = supabase
    .from("properties")
    .select("id, title, price, rental_price, listing_type, property_type, created_at")
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("price", { ascending: true, nullsFirst: false });

  const { data: props } = await query.limit(60);

  console.log("Total properties returned:", props?.length);
  const foundIdx = props?.findIndex(p => p.id === "96a2afb8-0c2b-4c43-88a1-3af5d98168f1");
  console.log("Index of Mantana property in default sort (Price ASC):", foundIdx);

  // Now query ordered by created_at DESC (Newest)
  const { data: newestProps } = await supabase
    .from("properties")
    .select("id, title, price, rental_price, listing_type, property_type, created_at")
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  console.log("\n=== TOP 10 NEWEST PROPERTIES IN DB ===");
  newestProps?.slice(0, 10).forEach((p, i) => {
    console.log(`${i + 1}. [${p.created_at}] ${p.id === '96a2afb8-0c2b-4c43-88a1-3af5d98168f1' ? '👉 (NEWEST MANTANA)' : ''} ${(p.title || '').slice(0, 60)}`);
  });
}

test().catch(console.error);
