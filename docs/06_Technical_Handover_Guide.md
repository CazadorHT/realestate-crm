# 📦 คู่มือการส่งมอบระบบ (Technical Handover Guide)

เอกสารฉบับนี้ใช้สำหรับเตรียมข้อมูลการส่งมอบระบบให้กับผู้ซื้อ เพื่อให้กระบวนการเปลี่ยนผ่าน (Transition) เป็นไปอย่างราบรื่นและเป็นมืออาชีพ

## 🔑 1. รายการบัญชีที่ต้องส่งมอบ (Account Checklist)

ผู้ขายควรเตรียม Account เหล่านี้ให้พร้อม (แนะนำให้ใช้ Email กลางของบริษัทในการผูกบัญชี):

| ระบบ (Platform)      | ข้อมูลที่ต้องเตรียม (Required Info) | ความสำคัญ  |
| :------------------- | :---------------------------------- | :--------- |
| **Supabase**         | Owner Access (Database & Auth)      | 🔴 สูงสุด  |
| **LINE Developers**  | Messaging API & Channel Secret      | 🔴 สูงสุด  |
| **Google Cloud**     | Gemini API Key & Billing Account    | 🟡 ปานกลาง |
| **Vercel / Netlify** | Production Deployment & Domain      | 🟡 ปานกลาง |
| **GitHub / Git**     | Full Source Code History            | 🔴 สูงสุด  |

---

## 🛠️ 2. ขั้นตอนการตั้งค่าระบบใหม่ (Setup Workflow)

หากผู้ซื้อต้องการนำไปรันบน Infrastructure ของตัวเอง:

1.  **Database Setup:**
    - Import SQL Schema จากไฟล์ `docs/04_Database_Schema_Setup.md`
    - ตั้งค่า RLS Policies จากไฟล์ `db-policy.json`
2.  **Environment Variables:**
    - คัดลอกค่าจาก `.env.example` (กรุณาสร้างไฟล์นี้หากยังไม่มี)
    - เปลี่ยนค่า API Keys เป็นของผู้ซื้อทั้งหมด
3.  **LINE Webhook:**
    - เปลี่ยน URL ใน LINE Developers Console ให้ชี้ไปยัง Domain ใหม่ของผู้ซื้อ

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
