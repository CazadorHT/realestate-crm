import dotenv from "dotenv";
dotenv.config();

import { getRecommendedProperties } from "../features/properties/recommended-actions";

async function main() {
  console.log("Fetching recommended properties...");
  try {
    const recs = await getRecommendedProperties(10);
    console.log("Recs found:", recs.length);
    if (recs.length > 0) {
      console.log("First rec:", JSON.stringify(recs[0], null, 2));
    }
  } catch (error) {
    console.error("Error in getRecommendedProperties:", error);
  }
}

main();
