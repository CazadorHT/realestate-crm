import dotenv from "dotenv";
dotenv.config();

async function run() {
  const url = "http://localhost:3000/api/public/properties";
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("API returned properties count:", data.properties?.length);
    console.log("API returned properties:", data.properties?.map((p: any) => ({ id: p.id, title: p.title, status: p.status, deleted_at: p.deleted_at })));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
