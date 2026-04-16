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

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Mobile-First Compact UI
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
| `/api/cron/unified`                 | ระบบรวมศูนย์รันงานอัตโนมัติรายวัน (สัญญา, ค่าเช่า, ถังขยะ, Market Alerts) |
| `/api/cron/notifications-retention` | ล้างแจ้งเตือนเก่าอัตโนมัติ               |

---

## 8. ระบบคำนวณคอมมิชชั่นขั้นสูง (Advanced Commission Logic) 🆕

ตาราง `deal_commissions` จัดเก็บข้อมูลสัดส่วนรายได้แยกตามบทบาท:

- **Calculation Formula:** (Price \* Commission Rate) - WHT (3%) = Net Amount
- **Role Split:** รองรับสูตรแบ่ง % ระหว่าง Listing Agent, Closing Agent และ Agency Fee
- **Smart Save Logic:** ป้องกันการบันทึกหากผลรวม % หรือจำนวนเงินไม่ตรงกับค่าคอมมิชชั่นรวมของดีล

## 9. โครงสร้าง Google Tag Manager (GTM Tracking) 🆕

ระบบติดตามพฤติกรรมใน `lib/gtm.ts` และ `components/providers/GTMPropertyPageView.tsx`:

- **DataLayer Push:** ส่งเหตุการณ์ (Events) เข้าสู่ GTM แบบ Real-time ครอบคลุมตั้งแต่อนุภาคเล็กๆ ไปจนถึงระดับ Conversion
- **Centralized Lead Form Tracking:** ดักจับ `lead_form_view` ทันทีที่ Component (DepositWizard) แสดงผล เพื่อหลีกเลี่ยงการเบิ้ล Event และแก้ปัญหาหน้าจอขนาดต่างๆ (Cross-Device Consistency)
- **Granular Image Engagement:** ใช้ Regex `^image_slide.*` ดักจับการสไลด์รูปภาพ 5 ระดับ (Start, Mid, Half, Deep, All) พร้อมส่งค่าตัวแปรภาพเชิงลึกเช่น `images_viewed`, `total_images`, และ `direction`
- **Funnel & Micro-conversions:** ติดตามทุกขั้นตอนตั้งแต่มองเห็น (`view_item`), กดทักแชท (`click_line`), เริ่มกรอกฟอร์มทีละขั้นตอน (`lead_form_step`), จนจบโฟลว์ (`lead_form_success`)
- **Enhanced E-commerce Pattern:** การส่งข้อมูลราคาและทำเลทรัพย์ใน Event `view_item` เพื่อใช้ทำ Remarketing

## 10. ระบบจัดการข้อผิดพลาด (Robust Error Handling) 🆕

- **Global Error Boundaries:** ใช้ `components/SafeMode.tsx` ครอบส่วนแสดงผลสำคัญเพื่อป้องกันแอปพัง (White Screen)
- **Atomic Loading States:** จัดการสถานะการรอ (Loading) รายคอมโพเนนต์ เพื่อประสบการณ์ผู้ใช้ที่ลื่นไหล
- **Audit Trail Consistency:** ระบบบันทึก Log ลง Supabase อัตโนมัติเมื่อเกิด Critical Error ฝั่ง Server

---

_คู่มือฉบับนี้จัดทำขึ้นโดยระบบ Antigravity AI สำหรับทีมเทคนิค VC Connect Asset_


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

