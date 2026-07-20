import { getSiteSettings } from "../features/site-settings/actions";

async function main() {
  const settings = await getSiteSettings();
  const token = settings.meta_page_access_token;
  if (!token) {
    console.error("Token not found!");
    return;
  }

  const pageId = "111608617234370";
  const url = `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps?subscribed_fields=feed,messages,messaging_postbacks,conversations&access_token=${token}`;

  console.log("Subscribing Page to App via Graph API...");
  try {
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    console.log("Subscription Response Status:", res.status);
    console.log("Subscription Response Data:", data);
  } catch (err: any) {
    console.error("Error subscribing page:", err.message);
  }
}

main().catch(console.error);
