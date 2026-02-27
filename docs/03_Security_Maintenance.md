# 🛡️ ความปลอดภัยและการดูแลระบบ (Security & Maintenance)

คู่มือการตรวจสอบความปลอดภัย การดูแลรักษาเครื่อง และการแก้ไขปัญหาเบื้องต้น

> **อัปเดตล่าสุด:** 27 กุมภาพันธ์ 2026

---

## 1. การตรวจสอบความปลอดภัย (Security Audit)

ระบบได้รับการออกแบบตามมาตรฐาน **OWASP Top Ten** และรองรับ **PDPA**:

- **Row Level Security (RLS) & Multi-Tenant:** ข้อมูลลูกค้าและเจ้าของทรัพย์ถูกล็อคตามสิทธิ์ (Staff Only) และมีการเปิดใช้ **Company/Branch/Agent Isolation** เพื่อแยกระดับการเข้าถึงข้อมูลระหว่างสาขาและรายคนอย่างเด็ดขาด
- **Server-side Validation:** ใช้ Zod Schema กลั่นกรองข้อมูลก่อนลงฐานข้อมูล 100%
- **Audit Logs:** บันทึกทุกความเคลื่อนไหวสำคัญ: Login, แก้ไขทรัพย์สิน, เข้าดู Lead, การโอนย้ายงาน (Lead Transfer), และการโพสต์ Social Media
- **Data Encryption:** ข้อมูลสำคัญที่ระบุตัวตนได้จะมีการจัดการตามมาตรฐานความปลอดภัยที่เหมาะสม
- **Cookie Consent (PDPA):** ระบบขอความยินยอมจากผู้ใช้ก่อนเก็บ Cookie รองรับ 3 ภาษา (TH/EN/CN)
- **Security Headers:** ตั้งค่า HSTS, CSP, X-Frame-Options, Referrer-Policy ครอบคลุมใน `next.config.ts`

---

## 2. ความปลอดภัยของ API ภายนอก (External API Security)

### Meta Webhook Verification

- ใช้ `META_VERIFY_TOKEN` ในการยืนยันตัวตนกับ Facebook/Instagram Webhook
- ทุก Request ที่เข้ามาจะถูกตรวจสอบ Signature ก่อนประมวลผล

### TikTok OAuth Flow

- ใช้ Authorization Code Flow ตามมาตรฐาน OAuth 2.0
- Token ถูกเก็บอย่างปลอดภัยใน `site_settings` (Encrypted at Database Level)
- มีการตรวจสอบ Token Expiry และ Refresh Token กลไก

### LINE Webhook Security

- ใช้ `LINE_CHANNEL_SECRET` ในการ Verify Signature ของทุก Event
- ป้องกัน Replay Attack ด้วย Timestamp Validation

---

## 3. การดูแลระบบ (System Monitoring)

- **Audit Logs Dashboard:** ผู้ดูแลระบบ (Admin) สามารถตรวจสอบประวัติการย้อนหลังได้โดยละเอียด
- **AI Usage Tracking:** มอนิเตอร์การใช้ Token ของ Gemini เพื่อบริหารความคุ้มค่าและควบคุมงบประมาณรายเดือน
- **Supabase Logs:** ตรวจสอบ Health และ Latency ของฐานข้อมูลผ่าน Supabase Dashboard
- **Cron Job Monitoring:** ระบบ Cron Jobs 3 ตัว (Contract Expiry, Rent Notifications, Trash Cleanup) ทำงานอัตโนมัติผ่าน Vercel Cron
- **Social Post Monitor:** ติดตามสถานะการโพสต์ทรัพย์สินลง Social Media (FB/IG/TikTok) แบบ Real-time

---

## 4. การแก้ไขปัญหา (Troubleshooting)

### ปัญหาพบบ่อย

1.  **LINE Chat ไม่เด้งในระบบ:** ตรวจสอบการตั้งค่า Webhook ใน LINE Developers Console ว่าได้เปิดใช้งาน (Enabled) และทดสอบ URL สำเร็จหรือไม่
2.  **AI เจนข้อมูลไม่ได้:** ตรวจสอบ API Key และ Quota ของ Google Cloud Project
3.  **รูปไม่อัพโหลด:** เช็คขนาดไฟล์ (จำกัด 5MB ต่อรูป) และสถานะสิทธิ์ใน Storage Bucket 'properties'
4.  **Meta Webhook ไม่ทำงาน:** ตรวจสอบ `META_VERIFY_TOKEN` ว่าตรงกับที่ตั้งไว้ใน Meta Developer Console, ตรวจสอบว่า App Mode เป็น Live, และ Webhook Subscription ถูกต้อง
5.  **TikTok Connect ล้มเหลว:** ตรวจสอบ `TIKTOK_CLIENT_KEY`, `TIKTOK_REDIRECT_URI` ว่าตรงกับ TikTok Developer Portal, ตรวจสอบ App Status และ Tester List
6.  **โพสต์ลง Social ไม่ได้:** ตรวจสอบ Page Access Token ด้วย [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) ว่ายังไม่หมดอายุ

---

## 5. แผนการบำรุงรักษา

- **Dependency Updates:** รัน `npm update` ประจำไตรมาสเพื่ออัปเดตแพตช์ความปลอดภัย
- **RLS Review:** ตรวจสอบนโยบายความเข้าถึงทุกครั้งที่มีการเพิ่มโมดูลใหม่
- **Database Backups:** Supabase ทำความสำรองข้อมูลให้อัตโนมัติ ควรเช็คสถานะ Backup เสมอ
- **Token Refresh:** ตรวจสอบ Meta Page Access Token ประจำทุก 60 วัน (หรือใช้ Long-lived Token)
- **Cron Health Check:** ตรวจสอบ Vercel Cron Logs ประจำสัปดาห์เพื่อให้แน่ใจว่า Jobs ทำงานปกติ

---
