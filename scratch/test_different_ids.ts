import { getSiteSettings } from "../features/site-settings/actions";

async function testGetComment(id: string, token: string) {
  try {
    const url = `https://graph.facebook.com/v20.0/${id}?access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    return { status: res.status, data };
  } catch (err: any) {
    return { error: err.message };
  }
}

async function main() {
  const settings = await getSiteSettings();
  const token = settings.meta_page_access_token;
  
  if (!token) {
    console.error("No token found!");
    return;
  }

  const ids = [
    "1001377949195638_1384170197142382",
    "1384170197142382"
  ];

  for (const id of ids) {
    console.log(`\nTesting GET for ID: ${id}`);
    const res = await testGetComment(id, token);
    console.log("Response:", res);
  }
}

main().catch(console.error);
