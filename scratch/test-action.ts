import dotenv from "dotenv";
dotenv.config();

import { submitInquiryAction } from "../features/public/actions";

async function main() {
  const formData = new FormData();
  formData.append("fullName", "Test Name");
  formData.append("phone", "0812345678");
  formData.append("lineId", "ไอดีไลน์");
  formData.append("whatsapp", "");
  formData.append("wechatId", "");
  formData.append("message", "สอบถามข้อมูลเพิ่มเติมครับ...");
  formData.append("marketing_attribution", "direct");
  formData.append("ai_lead_score", "10");

  console.log("Submitting inquiry action with empty optional inputs...");
  try {
    const result = await submitInquiryAction({}, formData);
    console.log("Result:", result);
  } catch (err) {
    console.error("Action threw error:", err);
  }
}

main();
