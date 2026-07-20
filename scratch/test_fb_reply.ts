import { sendPrivateReply } from "../lib/meta";

async function main() {
  const rawId = "1384170197142382";
  const combinedId = "1001377949195638_1384170197142382";
  
  console.log("Testing raw comment ID:", rawId);
  const dmResRaw = await sendPrivateReply(rawId, "สวัสดีครับ ทดสอบส่งด้วย Raw ID", "FACEBOOK");
  console.log("Raw response:", dmResRaw);

  console.log("\nTesting combined comment ID:", combinedId);
  const dmResCombined = await sendPrivateReply(combinedId, "สวัสดีครับ ทดสอบส่งด้วย Combined ID", "FACEBOOK");
  console.log("Combined response:", dmResCombined);
}

main().catch(console.error);
