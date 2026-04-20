import { getPublicProperties } from "../lib/services/properties";

async function testPriceFilter() {
  console.log("Testing Sale Price Filter (Under 2M)...");
  const { properties: saleUnder2M } = await getPublicProperties({
    listingType: "SALE",
    maxPrice: 2000000,
  });
  console.log(`Found ${saleUnder2M.length} properties.`);
  saleUnder2M.forEach(p => {
    const minPrice = Math.min(p.price || Infinity, p.original_price || Infinity);
    if (minPrice > 2000000) {
      console.error(`❌ FAILURE: Property ${p.id} has price ${p.price} and original ${p.original_price}`);
    }
  });

  console.log("\nTesting Rent Price Filter (Above 100k)...");
  const { properties: rentAbove100k } = await getPublicProperties({
    listingType: "RENT",
    minPrice: 100000,
  });
  console.log(`Found ${rentAbove100k.length} properties.`);
  rentAbove100k.forEach(p => {
    const maxPrice = Math.max(p.rental_price || 0, p.original_rental_price || 0);
    if (maxPrice < 100000) {
      console.error(`❌ FAILURE: Property ${p.id} has rent ${p.rental_price} and original ${p.original_rental_price}`);
    }
  });

  console.log("\nTesting Area Size Filter (50-100 sqm)...");
  const { properties: size50to100 } = await getPublicProperties({
    minSize: 50,
    maxSize: 100,
  });
  console.log(`Found ${size50to100.length} properties.`);
  size50to100.forEach(p => {
    if (p.size_sqm! < 50 || p.size_sqm! > 100) {
      console.error(`❌ FAILURE: Property ${p.id} has size ${p.size_sqm}`);
    }
  });

  console.log("\nBackend Logic Verification Complete.");
}

testPriceFilter().catch(console.error);
