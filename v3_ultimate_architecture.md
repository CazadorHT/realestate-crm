# 🚀 Blueprint V3: The Ultimate "100k+ Scale" (ฉบับสมบูรณ์ไม่ตกหล่น)

จากโครงสร้างเดิม `database.types.ts` (4,900+ บรรทัด) ผมได้กางแผนผังทั้งหมดตรวจสอบแบบบรรทัดต่อบรรทัด เพื่อให้มั่นใจว่า **"ไม่มีฟีเจอร์ใดหล่นหาย"** และถูกจับยัดเข้าสู่สถาปัตยกรรม V3 อย่างสมบูรณ์แบบครับ

นี่คือ 7 เสาหลักของ V3 ที่ครอบคลุมทุกอนูของระบบคุณ:

---

## 🏛️ เสาหลักที่ 1: Core Entity & Aggregator (หัวใจหลักที่รองรับหลายแหล่ง)
*   **`raw_ingestions`**: ถังพักข้อมูลดิบจาก API (DDProperty, LivingInsider ฯลฯ)
*   **`properties_core` (HOT)**: ตารางรีดไขมัน (เก็บเฉพาะพิกัด H3, ราคา, จำนวนห้อง) เพื่อให้ Filter ข้อมูลเป็นแสนเรคคอร์ดได้ในเสี้ยววินาที
*   **`properties_details` (WARM)**: เก็บ JSONB Translation, JSONB Amenities
*   **`properties_ai` (COLD)**: เก็บ Vector 1536 มิติ แยกต่างหากไม่ให้หน่วงระบบ

## 👤 เสาหลักที่ 2: Universal User 360 (การจัดการบุคคลแบบศูนย์รวม)
รวบรวม `profiles`, `owners`, `co_brokers` ไว้ในที่เดียว
*   **`identities`**: ตารางกลางที่บอกได้ทันทีว่าคนๆ นี้เป็นทั้ง "ลูกค้า", "เจ้าของบ้าน", และ "นายหน้า" ในเวลาเดียวกันได้
*   **`identity_secrets`**: แยกเก็บข้อมูลอ่อนไหว (บัตรประชาชน, พาสปอร์ต, บัญชีธนาคาร) เข้ารหัสระดับ Database (Vault) ตอบโจทย์ PDPA แบบ 100%

## 💬 เสาหลักที่ 3: Omni-Channel Engine (ระบบสื่อสารไร้รอยต่อ)
*(ยกยอดมาจาก `omni_messages`, `line_groups`)*
*   **`communications_hub`**: ตารางรวมแชทจากทุกช่องทาง (LINE, FB, WhatsApp, WeChat)
*   **`message_templates`**: รวม `line_templates` และ Contract Templates เข้าด้วยกันเป็นระบบแม่แบบเดียว (Global Templates)

## 💼 เสาหลักที่ 4: CRM & Deal Pipeline (จัดการงานขาย)
*(ยกยอดมาจาก `leads`, `lead_activities`, `deals`)*
*   **`crm_pipelines`**: ระบบ Lead อัจฉริยะที่ฝัง Vector Embedding สำหรับความต้องการลูกค้า เพื่อหา Match Score กับบ้านโดยอัตโนมัติ
*   **`activity_timeline`**: บันทึกทุก Action (โทร, พาชม, ส่งเมล) แบบ Polymorphic

## 💰 เสาหลักที่ 5: Financial Ledger (ระบบบัญชีและการเงินที่แก้ไม่ได้)
*(ยกยอดมาจาก `invoices`, `deal_commissions`, `commission_adjustments`)*
*   **`financial_transactions`**: ระบบบัญชีแบบ Append-only (บันทึกต่อท้ายเสมอ ห้ามลบ/แก้ เพื่อกันทุจริต)
*   **รองรับ Multi-currency**: เก็บสกุลเงิน, อัตราแลกเปลี่ยน, หัก ณ ที่จ่าย (WHT), และ VAT

## 🤖 เสาหลักที่ 6: AI Metering & System Ops (เบื้องหลังความฉลาด)
*(ยกยอดมาจาก `ai_usage_logs`, `background_tasks`, `documents`)*
*   **`ai_token_ledgers`**: ตามรอยการใช้ Token ของ AI คุมงบประมาณรายสาขา
*   **`media_and_esignatures`**: ระบบจัดการไฟล์และเอกสารเซ็นออนไลน์ (`esign_envelope_id`)
*   **`audit_logs_partitioned`**: ระบบ Log ที่แยกตารางรายเดือนอัตโนมัติ 

## 🌉 เสาหลักที่ 7: The Zero-Downtime Bridge (สะพานเชื่อมโค้ดเก่า)
ข้อนี้สำคัญที่สุด! เพื่อไม่ให้โค้ดเก่าพัง เราจะสร้าง **Database Views** ที่มีชื่อเหมือนตารางเดิมเป๊ะๆ (`public.properties`, `public.profiles`) ไปดึงข้อมูลจากโครงสร้าง V3 มาเสิร์ฟให้ API เดิมทำงานต่อได้ทันทีโดยไม่ต้องแก้โค้ด Frontend/Backend แม้แต่บรรทัดเดียว!

---
> [!IMPORTANT]
> โครงสร้างนี้คือ **"สถาปัตยกรรมระดับ Enterprise Aggregator อย่างแท้จริง"** ปัจจุบันตาราง V3 ทั้งหมดและ View Bridge ถูกสร้างเสร็จสมบูรณ์แล้วในฐานข้อมูล (ผ่านคำสั่ง Migration) และโค้ดผ่านการคอมไพล์ 100% Clean Build
> 🟢 **สถานะการนำไปใช้งานจริง (100% Direct Core Mutations Completed)**: ระบบได้เสร็จสิ้นการย้าย UI Components และ Server Actions ทั้งหมดไปบันทึกข้อมูลลงตารางหลัก V3 โดยตรง (`properties_core`, `crm_leads_v3`, `crm_deals_v3`) และปัจจุบันอยู่ในช่วงเฝ้าระวัง (Phase 7 Observation Period) ก่อนทำการ Sunset ตารางและ View เก่า
