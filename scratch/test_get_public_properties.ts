import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { getPublicProperties } from "@/lib/services/properties";

async function test() {
  const result = await getPublicProperties({ limit: 60, includeFacets: true });
  console.log("Total properties returned by getPublicProperties:", result.properties.length);
  const found = result.properties.find(p => p.id === "96a2afb8-0c2b-4c43-88a1-3af5d98168f1");
  console.log("Is Mantana property in returned properties?", !!found);
  
  if (result.properties.length > 0) {
    console.log("Top 5 properties returned:");
    result.properties.slice(0, 5).forEach((p, idx) => {
      console.log(`${idx + 1}. [${p.created_at}] Price: ${p.price || p.rental_price} | ${p.title.slice(0, 50)}`);
    });
  }
}

test().catch(console.error);
