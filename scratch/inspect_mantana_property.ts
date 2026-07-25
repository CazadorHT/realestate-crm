import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function inspect() {
  const supabase = createAdminClient();
  const propId = "96a2afb8-0c2b-4c43-88a1-3af5d98168f1";

  const { data: prop, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propId)
    .single();

  if (error) {
    console.error("Error fetching property:", error);
    return;
  }

  console.log("=== FULL PROPERTY DATA ===");
  console.log({
    id: prop.id,
    title: prop.title,
    status: prop.status,
    deleted_at: prop.deleted_at,
    listing_type: prop.listing_type,
    property_type: prop.property_type,
    price: prop.price,
    rental_price: prop.rental_price,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    size_sqm: prop.size_sqm,
    is_hot_deal: prop.is_hot_deal,
    is_featured: prop.is_featured,
    created_at: prop.created_at,
    updated_at: prop.updated_at,
    tenant_id: prop.tenant_id,
    assigned_to: prop.assigned_to,
  });
}

inspect().catch(console.error);
