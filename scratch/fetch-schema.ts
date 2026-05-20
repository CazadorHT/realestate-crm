import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  const url = `${supabaseUrl}/rest/v1/`;
  const response = await fetch(url, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });

  const schema = await response.json();
  const paths = Object.keys(schema.paths || {});
  
  const rpcs = paths.filter(p => p.startsWith("/rpc/"));
  const filteredRpcs = rpcs.filter(p => {
    const name = p.replace("/rpc/", "");
    return !name.startsWith("st_") && 
           !name.startsWith("_st_") && 
           !name.startsWith("geometry_") && 
           !name.startsWith("postgis_") &&
           !name.startsWith("pg_");
  });

  console.log("Filtered RPCs:");
  console.log(filteredRpcs);
}

run().catch(console.error);
