# 🛠️ คู่มือทางเทคนิคและฐานข้อมูล (Technical & Database Guide)

รายละเอียดการติดตั้ง โครงสร้างฐานข้อมูล และผังการทำงานของระบบ Real Estate CRM (Enterprise Edition)

> **อัปเดตล่าสุด:** 4 มีนาคม 2026 (Enterprise v2.0 & Multi-Branch Ready)

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
- **Monitoring:** System Health & Integration Checks (Supabase, TikTok)

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

## 4. ระบบจัดการเอกสารและสัญญา (Document & Contract Engine)

กลไกการสร้างเอกสารใน `features/documents/generation-actions.ts`:

1. **Dynamic Smart Contracts (.docx to PDF):** ระบบหน้า Admin รองรับการอัปโหลดไฟล์ Microsoft Word (`.docx`) ที่ฝังตัวแปร (เช่น `{{tenant_name}}`, `{{price}}`) ระบบจะคำนวณและแปลงเป็น PDF ผ่านไลบรารีหรือ API แบบจับคู่
2. **HTML Template Fallback:** กรณีเอกสารทั่วไป ใช้ไฟล์ HTML พร้อม Placeholder
3. **Base64 Embedding:** ค้นหารูปภาพ (Logo, Signature, Stamp) และแปลงเป็น Base64 ฝังลงในไฟล์เพื่อความปลอดภัยและแสดงผลได้ทุกที่
4. **In-App Preview:** ดึงรหัส HTML หรือแสดง PDF Thumbnail ในแอปโดยตรงผ่าน `DocumentPreviewDialog` แก้ปัญหาภาษาไทยเพี้ยนและนโยบายความปลอดภัยของบราวเซอร์
5. **E-Signature:** เชื่อมต่อกับ Mock/Production E-Sign Provider เพื่อส่งลิงก์เซ็นสัญญาออนไลน์ พร้อมสถานะ Version Control

---

## 5. ระบบประเมินราคาอัจฉริยะ (Automated Valuation Model - AVM)

กลไกวิเคราะห์ราคาใน `features/properties/actions/avm.ts`:

- **Market Comps Analysis:** ดึงข้อมูลทรัพย์สินที่ประกาศขาย/เช่าในรัสมีใกล้เคียง (Radius Search via PostGIS หรือ Lat/Lng Matching)
- **AI Dynamic Pricing:** Gemini 2.0 สังเคราะห์ข้อมูลเพื่อคำนวณราคาแนะนำ 3 สเตป: Max Profit, Market Price, Quick Sale
- **Valuation PDF Report:** พ่นรายการข้อมูล AVM ออกมาเป็นรายงาน Document (PDF) เพื่อให้นายหน้าส่งต่อให้เจ้าของทรัพย์ (Lead Gen)
- **Market Drop Alert Background:** รันเบื้องหลังเพื่อตรวจจับดีลที่ขายต่ำกว่าราคาตลาด แล้วบันทึกลง Audit/Notification

---

## 6. โครงสร้างฐานข้อมูลสำคัญ (Database Schema)

- **`ai_usage_logs`**: เก็บประวัติการใช้งาน AI และต้นทุนเงินบาท
- **`tenants` / `tenant_members`**: หัวใจของระบบ Multi-Tenant
- **`notifications`**: ระบบแจ้งเตือน Real-time (Supabase Realtime)
- **`documents`**: เก็บ Metadata เอกสาร พร้อมระบบ Versioning (`parent_id`, `version`)
- **`docx_templates`**: เก็บไฟล์ต้นฉบับสัญญา `.docx` ที่รอการดึงไปแปลงค่า
- **`avm_contexts`**: เก็บประวัติการประเมินราคา เพื่อนำไปใช้กับ PDF และโชว์ย้อนหลังได้
- **`audit_logs`**: บันทึกกิจกรรมสำคัญพร้อมระบบ Auto-cleanup (1 ปี) ผ่าน `pg_cron`

---

## 7. ผังการทำงานและ API (Architecture & API)

### 📡 Webhook & Cron Registry

| Endpoint                            | หน้าที่                                  |
| :---------------------------------- | :--------------------------------------- |
| `/api/webhook/line`                 | รับแชทและ Events จาก LINE                |
| `/api/webhook/meta`                 | รับ Lead Ads และ Comment จาก FB/IG       |
| `/api/webhook/tiktok`               | รับ Webhook จาก TikTok                   |
| `/api/cron/trash-cleanup`           | ลบ Audit Logs ที่เก่าเกิน 1 ปี (pg_cron) |
| `/api/cron/notifications-retention` | ล้างแจ้งเตือนเก่าอัตโนมัติ               |
| `/api/cron/market-alerts`           | ตรวจสอบราคาตลาดตก และพ่นแจ้งเตือน Agent  |

---

## 8. ระบบคำนวณคอมมิชชั่นขั้นสูง (Advanced Commission Logic) 🆕

ตาราง `deal_commissions` จัดเก็บข้อมูลสัดส่วนรายได้แยกตามบทบาท:

- **Calculation Formula:** (Price \* Commission Rate) - WHT (3%) = Net Amount
- **Role Split:** รองรับสูตรแบ่ง % ระหว่าง Listing Agent, Closing Agent และ Agency Fee
- **Smart Save Logic:** ป้องกันการบันทึกหากผลรวม % หรือจำนวนเงินไม่ตรงกับค่าคอมมิชชั่นรวมของดีล

## 9. โครงสร้าง Google Tag Manager (GTM Tracking) 🆕

ระบบติดตามพฤติกรรมใน `lib/gtm.ts` และ `components/providers/GTMPropertyPageView.tsx`:

- **DataLayer Push:** ส่งเหตุการณ์ (Events) เข้าสู่ GTM แบบ Real-time
- **Core Events:** `click_line`, `click_phone`, `submit_contact_form`, `view_item`, `ai_lead_score`
- **Enhanced E-commerce Pattern:** การส่งข้อมูลราคาและทำเลทรัพย์ใน Event `view_item` เพื่อใช้ทำ Remarketing

## 10. ระบบจัดการข้อผิดพลาด (Robust Error Handling) 🆕

- **Global Error Boundaries:** ใช้ `components/SafeMode.tsx` ครอบส่วนแสดงผลสำคัญเพื่อป้องกันแอปพัง (White Screen)
- **Atomic Loading States:** จัดการสถานะการรอ (Loading) รายคอมโพเนนต์ เพื่อประสบการณ์ผู้ใช้ที่ลื่นไหล
- **Audit Trail Consistency:** ระบบบันทึก Log ลง Supabase อัตโนมัติเมื่อเกิด Critical Error ฝั่ง Server

---

_คู่มือฉบับนี้จัดทำขึ้นโดยระบบ Antigravity AI สำหรับทีมเทคนิค VC Connect Asset_
