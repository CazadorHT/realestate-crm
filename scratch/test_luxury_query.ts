import dotenv from "dotenv";
dotenv.config();

import { getPublicProperties } from "../lib/services/properties";

async function test() {
  console.log("Testing luxuryVilla query...");
  try {
    const result = await getPublicProperties({ luxuryVilla: true, limit: 10 });
    console.log("Query successful!");
    console.log("Count:", result.properties?.length);
    console.log("Sample Properties:", result.properties?.map(p => ({
      id: p.id,
      title: p.title,
      property_type: p.property_type,
      price: p.price,
      rental_price: p.rental_price
    })));
  } catch (error) {
    console.error("Query failed with error:", error);
  }
}

test();
