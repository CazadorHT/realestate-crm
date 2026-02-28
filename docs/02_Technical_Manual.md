# 🛠️ คู่มือทางเทคนิคและฐานข้อมูล (Technical & Database Guide)

รายละเอียดการติดตั้ง โครงสร้างฐานข้อมูล และผังการทำงานของระบบ Real Estate CRM (Enterprise Edition)

> **อัปเดตล่าสุด:** 28 กุมภาพันธ์ 2026 (Enterprise v2.0 Baseline)

---

## 1. การติดตั้งและตั้งค่าระบบ (Technical Setup)

### ความต้องการของระบบ (Prerequisites)

- Node.js 22.x+, npm หรือ pnpm
- Supabase Account, Gemini 2.0 API Key, LINE Messaging API
- Adobe Sign / NDID Integration (สำหรับ E-Signature)
- Meta & TikTok Developer Accounts

### ภาษาและเครื่องมือหลัก (Core Stack)

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** Next.js Server Actions, Edge Functions
- **Database:** Supabase (PostgreSQL) + **RLS (Multi-Tenancy)**
- **AI Engine:** Google Gemini 2.0 (Flash/Pro)

---

## 2. สถาปัตยกรรมแยกสาขา (Multi-Tenant Architecture)

ระบบใช้โครงสร้าง **Shared Database, Isolated Rows** เพื่อความปลอดภัยและขยับขยายได้ง่าย:

### 🛡️ Row-Level Security (RLS)

ทุกตารางสำคัญจะมีคอลัมน์ `tenant_id` เพื่อระบุเจ้าของข้อมูล (บริษัท/สาขา):

- **Tenant Isolation:** ข้อมูลของแต่ละบริษัทจะไม่ปะปนกันที่ระดับฐานข้อมูล
- **Branch Management:** มีตาราง `tenants` (สาขา) และ `tenant_members` (พนักงานในสาขา)
- **Security Policy:** ใช้ฟังก์ชัน `get_user_tenants()` ใน PostgreSQL เพื่อตรวจสอบสิทธิ์การเข้าถึงแบบ Real-time

---

## 3. ระบบคำนวณต้นทุน AI (AI Financial Engine)

ระบบมีการติดตามและคำนวณต้นทุนการเรียกใช้ AI อย่างละเอียดในไฟล์ `features/ai-monitor/actions.ts`:

- **Token Tracking:** บันทึก `prompt_tokens` และ `completion_tokens` ลงในตาราง `ai_usage_logs`
- **Exchange Rate:** ใช้อัตราแลกเปลี่ยนคงที่ **32 THB/USD** เพื่อความเสถียรในการรายงานผล
- **Model Rates:** อิงตามราคาจริงของ Google Gemini (เช่น 1.5 Flash = $0.1/1M tokens)
- **Real-time Costing:** แสดงผลต้นทุนรวมและต้นทุนแยกตามฟีเจอร์ (Blog, Chat, Translation) ทันที

---

## 4. ระบบจัดการเอกสารอัจฉริยะ (Document Generation Engine)

กลไกการสร้างเอกสารใน `features/documents/generation-actions.ts`:

1. **HTML Template:** ใช้ไฟล์ HTML พร้อม Placeholder (เช่น `{{lead.full_name}}`)
2. **Base64 Embedding:** ค้นหารูปภาพ (Logo, Signature, Stamp) และแปลงเป็น Base64 ฝังลงในไฟล์เพื่อความปลอดภัยและแสดงผลได้ทุกที่
3. **In-App Preview:** ดึงรหัส HTML มาแสดงผลในแอปโดยตรงผ่าน `DocumentPreviewDialog` แก้ปัญหาภาษาไทยเพี้ยนและนโยบายความปลอดภัยของบราวเซอร์
4. **E-Signature:** เชื่อมต่อกับ Mock/Production E-Sign Provider เพื่อส่งลิงก์เซ็นสัญญาออนไลน์

---

## 5. โครงสร้างฐานข้อมูลสำคัญ (Database Schema)

- **`ai_usage_logs`**: เก็บประวัติการใช้งาน AI และต้นทุนเงินบาท
- **`tenants` / `tenant_members`**: หัวใจของระบบ Multi-Tenant
- **`notifications`**: ระบบแจ้งเตือน Real-time (Supabase Realtime)
- **`documents`**: เก็บ Metadata เอกสาร พร้อมระบบ Versioning (`parent_id`, `version`)
- **`audit_logs`**: บันทึกกิจกรรมสำคัญพร้อมระบบ Auto-cleanup (1 ปี) ผ่าน `pg_cron`

---

## 6. ผังการทำงานและ API (Architecture & API)

### 📡 Webhook & Cron Registry

| Endpoint                            | หน้าที่                                  |
| :---------------------------------- | :--------------------------------------- |
| `/api/webhook/line`                 | รับแชทและ Events จาก LINE                |
| `/api/webhook/meta`                 | รับ Lead Ads และ Comment จาก FB/IG       |
| `/api/webhook/tiktok`               | รับ Webhook จาก TikTok                   |
| `/api/cron/trash-cleanup`           | ลบ Audit Logs ที่เก่าเกิน 1 ปี (pg_cron) |
| `/api/cron/notifications-retention` | ล้างแจ้งเตือนเก่าอัตโนมัติ               |

---

_คู่มือฉบับนี้จัดทำขึ้นโดยระบบ Antigravity AI สำหรับทีมเทคนิค VC Connect Asset_
