import { getSiteSettings } from "../features/site-settings/actions";

async function main() {
  const settings = await getSiteSettings();
  const token = settings.meta_page_access_token;
  if (!token) {
    console.error("Token not found!");
    return;
  }

  // Use the latest comment ID that was received
  const commentId = "1001377949195638_1384170197142382";
  
  console.log("Testing Facebook Private Reply using /me/messages endpoint...");
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${token}`;
  
  const payload = {
    recipient: {
      comment_id: commentId
    },
    message: {
      text: "สวัสดีครับ ทดสอบส่งข้อความผ่านทาง /me/messages ด้วย comment_id ครับ! 🚀"
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    console.log("Response Status:", res.status);
    console.log("Response Body:", await res.json());
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main().catch(console.error);
