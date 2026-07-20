import { getSiteSettings } from "../features/site-settings/actions";

async function testPostJSON(commentId: string, token: string) {
  const url = `https://graph.facebook.com/v20.0/${commentId}/private_replies?access_token=${token}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ทดสอบส่ง JSON" })
    });
    const data = await res.json();
    return { status: res.status, data };
  } catch (err: any) {
    return { error: err.message };
  }
}

async function testPostForm(commentId: string, token: string) {
  const url = `https://graph.facebook.com/v20.0/${commentId}/private_replies?access_token=${token}`;
  try {
    const params = new URLSearchParams();
    params.append("message", "ทดสอบส่ง Form URL Encoded");
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    const data = await res.json();
    return { status: res.status, data };
  } catch (err: any) {
    return { error: err.message };
  }
}

async function testPostQuery(commentId: string, token: string) {
  const url = `https://graph.facebook.com/v20.0/${commentId}/private_replies?message=${encodeURIComponent("ทดสอบส่ง Query String")}&access_token=${token}`;
  try {
    const res = await fetch(url, {
      method: "POST"
    });
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
    console.error("Token not found!");
    return;
  }

  const commentId = "1001377949195638_1384170197142382";

  console.log("1. Testing JSON POST...");
  const resJson = await testPostJSON(commentId, token);
  console.log("JSON response:", resJson);

  console.log("\n2. Testing Form URL-Encoded POST...");
  const resForm = await testPostForm(commentId, token);
  console.log("Form response:", resForm);

  console.log("\n3. Testing Query Parameter POST...");
  const resQuery = await testPostQuery(commentId, token);
  console.log("Query response:", resQuery);
}

main().catch(console.error);
