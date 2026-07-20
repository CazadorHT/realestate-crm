async function main() {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  
  if (!token) {
    console.error("META_PAGE_ACCESS_TOKEN is not defined in env!");
    return;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${token}`);
    const data = await res.json();
    console.log("Token Information Query Result:");
    console.log(JSON.stringify(data, null, 2));

    // Also test sending private reply with this new token
    const commentId = "1001377949195638_1365973948834276";
    console.log("\nTesting private reply with new token...");
    const replyRes = await fetch(`https://graph.facebook.com/v20.0/${commentId}/private_replies?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ทดสอบส่งแชตด้วย Page Access Token ใหม่สำเร็จ! 🎉" })
    });
    console.log("Private reply test status:", replyRes.status);
    console.log("Private reply test response:", await replyRes.json());
  } catch (err: any) {
    console.error("Error testing token:", err.message);
  }
}

main().catch(console.error);
