# 📦 คู่มือการส่งมอบระบบ (Technical Handover Guide)

เอกสารฉบับนี้ใช้สำหรับเตรียมข้อมูลการส่งมอบระบบให้กับผู้ซื้อ เพื่อให้กระบวนการเปลี่ยนผ่าน (Transition) เป็นไปอย่างราบรื่นและเป็นมืออาชีพ

> **อัปเดตล่าสุด:** 4 มีนาคม 2026

## 🔑 1. รายการบัญชีที่ต้องส่งมอบ (Account Checklist)

ผู้ขายควรเตรียม Account เหล่านี้ให้พร้อม (แนะนำให้ใช้ Email กลางของบริษัทในการผูกบัญชี):

| ระบบ (Platform)       | ข้อมูลที่ต้องเตรียม (Required Info)   | ความสำคัญ  |
| :-------------------- | :------------------------------------ | :--------- |
| **Supabase**          | Owner Access (Database & Auth)        | 🔴 สูงสุด  |
| **LINE Developers**   | Messaging API & Channel Secret        | 🔴 สูงสุด  |
| **Meta (Facebook)**   | App ID, App Secret, Page Access Token | 🔴 สูงสุด  |
| **TikTok Developers** | Client Key, Client Secret, App Review | 🟡 ปานกลาง |
| **Google Cloud**      | Gemini API Key & Billing Account      | 🟡 ปานกลาง |
| **Google Analytics**  | GA4 Property & GTM Container Admin    | 🔴 สูงสุด  |
| **Vercel / Netlify**  | Production Deployment & Domain        | 🟡 ปานกลาง |
| **GitHub / Git**      | Full Source Code History              | 🔴 สูงสุด  |

---

## 🛠️ 2. ขั้นตอนการตั้งค่าระบบใหม่ (Setup Workflow)

หากผู้ซื้อต้องการนำไปรันบน Infrastructure ของตัวเอง:

1.  **Database Setup:**
    - Import SQL Schema จากไฟล์ `docs/04_Database_Schema_Setup.md`
    - ตั้งค่า RLS Policies จากไฟล์ `db-policy.json`
2.  **Environment Variables:**
    - คัดลอกค่าจาก `.env.example` (กรุณาสร้างไฟล์นี้หากยังไม่มี)
    - เปลี่ยนค่า API Keys เป็นของผู้ซื้อทั้งหมด:
      - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
      - `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
      - `GEMINI_API_KEY` (สำคัญมากสำหรับ AI Valuation และ Document Assistant)
      - `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_VERIFY_TOKEN`
      - `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
      - `DOCUSIGN_INTEGRATION_KEY` (หรือ API Key ของผู้ให้บริการ e-Signature ที่ต้องการ)
3.  **LINE Webhook:**
    - เปลี่ยน URL ใน LINE Developers Console ให้ชี้ไปยัง Domain ใหม่ของผู้ซื้อ (`/api/webhook/line`)
4.  **Meta Webhook:**
    - ตั้งค่า Webhook URL ใน Meta Developer Console ให้ชี้ไปยัง `/api/webhook/meta`
    - ตั้งค่า Verify Token ให้ตรงกับ `META_VERIFY_TOKEN` ใน `.env`
    - Subscribe to: `messages`, `messaging_postbacks`, `comments`, `leadgen`
5.  **TikTok App Setup:**
    - สร้าง App ใน TikTok Developer Portal
    - ตั้งค่า Redirect URI: `https://your-domain.com/api/auth/callback/tiktok`
    - เปิด Products: Login Kit, Content Posting API
6.  **Vercel Cron Jobs:**
    - ตรวจสอบว่า `vercel.json` มีการตั้งค่า Cron Schedule สำหรับ 4 Jobs หลัก:
      - `/api/cron/unified` (ระบบรวมศูนย์สำหรับ: เช็คสัญญาหมดอายุ, แจ้งเตือนค่าเช่า, ล้างถังขยะ และ Market Alerts)

---

## 🛡️ 3. การโอนสิทธิ์ทรัพย์สินทางปัญญา (IP Transfer)

- **Source Code:** ส่งมอบสิทธิ์ใน Private Repository ทั้งหมด
- **License File:** ตรวจสอบว่าไฟล์ `LICENSE` ใน Root directory ระบุชื่อผู้ซื้อหลังปิดดีลแล้ว
- **Assets:** รูปภาพไอคอน, โลโก้ และงานดีไซน์ทั้งหมดในโฟลเดอร์ `public/`

---

## 📞 4. ข้อตกลงหลังการขาย (Post-Sale Support)

_(ส่วนนี้ควรระบุตามความตกลงจริง)_

- ระยะเวลาการ Support (เช่น 3-6 เดือน)
- ช่องทางการติดต่อกรณีเกิด Critical Bugs
- ข้อตกลงเรื่องการอัปเดตฟีเจอร์ในอนาคต

---

> **คำแนะนำ:** ก่อนส่งมอบทุกครั้ง ควรลบข้อมูล Lead และ Owner ที่เป็นข้อมูลจริง (Production Data) ออกทั้งหมด หรือทำ Anonymization เพื่อป้องกันความเสี่ยงด้าน PDPA ของลูกค้ารายเดิมครับ


---

> 🚀 **อัปเดตสถานะโครงการล่าสุด (Late April 2026 - Enterprise Hardening Phase):**
> โปรเจคได้รับการยกระดับและจัดเตรียมความพร้อมขั้นสูงสุด (Production-Grade) โดยสิ่งที่ทำเสร็จสมบูรณ์เพิ่มเติมล่าสุดประกอบด้วย:
> - **🛡️ Native Proxy Type-Safety & Zero-Any:** ระบบหุ้มฐานข้อมูล (Runtime Proxy) ดักจับ CRUD Operations เพื่อบังคับใช้ `tenant_id` และป้องกันบั๊กข้ามสาขาอัตโนมัติ 100%
> - **⚡ Atomic Database & RPC Orchestrator:** ย้าย Business Logic ที่สำคัญเจาะจง (เช่น การย้ายบ้าน, ตัดสต็อก, เปลี่ยนดีล) ไปเป็น PostgreSQL RPC ป้องกันการสับเปลี่ยนข้อมูลผิดพลาด 
> - **💬 Enterprise Realtime Inbox:** ระบบแชท Omni-channel ขั้นเทพ รองรับ Infinite Scroll การกรองแยกหมวดหมู่ (Zero-latency) พร้อมสถานะการอ่าน/พิมพ์
> - **🔄 Inngest Background Jobs:** แยกงานที่หนักหัวเซิร์ฟเวอร์หลัก (AI Generation, การโพสต์โซเชียล) เข้ากระบวนการคิวอัตโนมัติ 
> - **🧱 Upstash Rate Limiting & Security:** ป้องกันสแปมและ Bot รัว API พร้อมระบบ Webhook Idempotency กันการยิงจาก Meta/Line ซ้ำซ้อน 
> - **🕰️ Property Audit Timeline:** ระบบ UI ตรวจดูประวัติการแก้ไขทุกฟิลด์ (Visual Diffing) พ่นชื่อผู้แก้ไขพร้อมปุ่มคลิก "กู้คืนเวอร์ชันเก่า" ได้ทันที
> - **🩺 Sentinel AI Human-in-the-Loop:** ระบบกรองความถูกต้องจากมนุษย์อีกชั้น ก่อนให้ผลลัพธ์ของ AI เผยแพร่จริง เพื่อความปลอดภัยต่อกฏหมาย

