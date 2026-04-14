import crypto from 'crypto';
import 'dotenv/config';

// 1. ตั้งค่าพื้นฐาน (ดึงจาก .env)
const secret = process.env.LINE_CHANNEL_SECRET;
const url = 'http://localhost:3000/api/line-webhook'; // ตรวจสอบว่ารัน npm run dev อยู่

// 2. สร้าง Payload จำลอง (ใช้รหัส Event เดิม)
const eventId = "test-enterprise-id-" + Date.now();
const body = JSON.stringify({
  events: [{
    type: 'message',
    webhookEventId: eventId,
    message: { type: 'text', text: 'Test Redis Idempotency' },
    source: { userId: 'U-TEST-USER' },
    replyToken: 'dummy'
  }]
});

// 3. คำนวณ Signature ให้ถูกต้อง
const signature = crypto.createHmac('sha256', secret).update(body).digest('base64');

async function sendTest(label) {
  console.log(`\n[${label}] ส่งคำขอไปยัง Webhook...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'x-line-signature': signature, 
        'Content-Type': 'application/json' 
      },
      body
    });
    console.log(`สถานะ HTTP: ${res.status}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

// 4. รันการทดสอบ 2 ครั้งติดกัน
async function run() {
  console.log("=== เริ่มการทดสอบ Idempotency (Elite Spec) ===");
  await sendTest("ครั้งที่ 1: ควรประมวลผลปกติ");
  await sendTest("ครั้งที่ 2: ควรข้าม (Duplicate)");
  console.log("\nการทดสอบเสร็จสิ้น! กรุณาเช็ค Log ใน Terminal ที่รัน npm run dev");
}

run();
