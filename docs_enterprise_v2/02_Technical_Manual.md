# 🛠️ 02: คู่มือเทคนิคัลเจาะลึก (Enterprise Technical Manual)

> **เทคโนโลยีแกนกลาง:** Next.js 16.2 (App Router), Turbopack, Tailwind CSS 4, Agentic AI (Gemini 1.5 Flash), Supabase Diamond Hardened
> **ระดับความเข้มข้น:** สถาปนิกระบบ (Systems Architecture)

เอกสารฉบับนี้เจาะลึกถึงก้นบึ้งของเทคนิคการประกอบโมดูล (Composability) และสถาปัตยกรรมระดับโค้ดของแอปพลิเคชันเวอร์ชัน 4.0 ที่ยกระดับสู่ความปลอดภัยระดับ Diamond และความแม่นยำของข้อมูลสูงสุด

---

## 1. Agentic Search Engine Architecture (Hybrid Scoring 70/30)

ระบบค้นหาทรัพย์สินในเวอร์ชัน 4.0 ไม่ใช่เพียงการค้นหาด้วยคำ (Keyword Search) แต่เป็นระบบ **Agentic Discovery** ที่ใช้การประมวลผลสองชั้น:

### 1.1 Semantic Reasoning Layer (70%)
ใช้เทคนิค **Vector Embedding** ร่วมกับ Gemini AI ในการวิเคราะห์ "เจตนา" ของผู้ใช้งาน เช่น เมื่อเซลล์พิมพ์ว่า "หาห้องที่วิวสวย เดินทางสะดวกสำหรับคนทำงานออฟฟิศสุขุมวิท" AI จะวิเคราะห์ความหมายของคำว่า "เดินทางสะดวก" และ "วิวสวย" เพื่อดึงข้อมูลทรัพย์ที่มีลักษณะใกล้เคียงที่สุดแม้จะไม่มีคำเหล่านั้นในชื่อทรัพย์

### 1.2 Hard-Filter Constraints (30%)
ทำงานควบคู่กับ SQL Filter ที่เป็น Hard-logic (ราคา, พื้นที่, จำนวนห้องนอน) เพื่อยืนยันว่าผลลัพธ์ที่ได้ "ถูกต้องตามเงื่อนไข" 100% ก่อนจะนำมาผ่านระบบ **Hybrid Scoring** เพื่อเรียงลำดับความคุ้มค่า

---

## 2. 🧙‍♂️ มนตร์ดำแห่ง Type-Safety: "The Hardened Proxy"

นี่คือหัวใจของการวาง **Enterprise Tenant Isolation** ที่ผ่านการ Audit แล้วว่าข้อมูลไม่มีวันรั่วไหลข้ามสาขา (Zero Data Leakage)

### 2.1 Native Proxy Interception
โปรเจคนี้มีการสร้าง **Object Proxy (ES6 Proxy)** ครอบกลไกฐานข้อมูลของ Supabase ในระดับลึกสุด:
- **Automatic Tenant Injection**: เมื่อมีการเรียก `from('table')` ระบบจะฉีด `tenant_id` ของสาขานั้นๆ เข้าไปในทุก Query โดยอัตโนมัติ
- **Read-Only Scoping**: สำหรับพนักงานระดับ Agent ระบบจะสลับ Scope เป็น Restricted Mode ทันทีในระดับ Runtime ทำให้ไม่สามารถเข้าถึงคำสั่งที่เสี่ยงต่อการทำลายข้อมูลชุดใหญ่ได้

---

## 3. Process Monitor & Background Resilience (Inngest)

การจัดการงานหนัก (Heavy Tasks) ในระดับ Enterprise ต้องการความโปร่งใสและตรวจสอบได้:

- **Centralized Task Monitoring**: งานหลังบ้านทั้งหมด (AI Translation, PDF Generation, Social Media Posting) จะถูกบันทึกสถานะลงใน **Process Monitor Engine** 
- **Self-Healing Background Jobs**: ด้วยสถาปัตยกรรมของ **Inngest**, หาก Webhook ล่มหรือ AI เกิด Error, ระบบจะทำการ Retry อัตโนมัติ (Exponential Backoff) และสามารถ "ไปต่อ" จากจุดเดิมได้ (Resilience) โดยไม่ทำให้ข้อมูลพัง
- **Audit-ready Task Logs**: ผู้ดูแลระบบสามารถตรวจสอบย้อนหลังได้ทุก Task ว่า "ใครสั่ง, รันเมื่อไหร่, ผลลัพธ์เป็นอย่างไร" เพื่อใช้ในการทำ Financial & Operational Audit

---

## 4. Mobile Perfection & UI Strategy (React 19 Hooks)

แอปพลิเคชันเวอร์ชัน 4.0 ใช้ขีดความสามารถของ **React 19** และ **Next.js 16.2 Turbopack**:
- **Optimistic UI Updates**: การกด Like ทรัพย์สินหรือการเปลี่ยนสถานะดีลจะเกิดขึ้นทันทีในหน้าจอ (Instant Feedback) ก่อนที่เซิร์ฟเวอร์จะตอบกลับ มอบประสบการณ์ที่ลื่นไหลสูงสุด
- **Dynamic Mobile Drawers**: เปลี่ยนระบบ Pop-up ที่เกะกะบนมือถือ เป็น **Bottom Drawers (Vaul)** ที่รองรับการสัมผัส (Gestures) อย่างสมบูรณ์
- **Infinite Hydration**: หน้าแชท Omni-channel รองรับการโหลดข้อมูลมหาศาลโดยใช้ทรัพยากรเครื่อง (RAM) ต่ำที่สุดผ่านเทคนิค Virtual Scrolling

---

## 5. 💎 Atomic RPC & Internal Schema Isolation

เพื่อความปลอดภัยและความแม่นยำสูงสุดในระดับ Enterprise โปรเจกต์ v4.0 ได้นำสถาปัตยกรรมระดับสูงมาใช้:
- **Internal Schema Isolation**: ย้ายฟังก์ชันที่เป็นความลับและฟังก์ชันระบบ (เช่น การจัดการ User, Audit Logs) ไปไว้ใน `internal` schema ซึ่งไม่สามารถเข้าถึงได้ผ่าน Public REST API ป้องกันการแฮกเกอร์เจาะช่องโหว่ RPC
- **Atomic Database RPC**: เปลี่ยนการทำงานที่ซับซ้อน (เช่น การทำสัญญา, การแบ่งคอมมิชชั่น) จากโค้ดฝั่งหน้าบ้านมาเป็น PostgreSQL Functions ที่รันแบบ Transaction 100% มั่นใจว่าข้อมูลจะไม่มีวันผิดพลาดแม้เน็ตจะหลุดระหว่างทาง
- **Deterministic Search Path**: ฟังก์ชันทั้งหมดถูกล็อค `search_path` อย่างเข้มงวดเพื่อป้องกันการโจมตีแบบ Search-path Hijacking

---

## 6. 🎨 Social Studio & Live Asset Generator Engine

สถาปัตยกรรมฝั่ง **Social Media Asset Generation** (`components/social-studio`):
- **Dynamic Platform UI Overlays**: รองรับการพรีวิวเสมือนจริงบนหน้าจอโซเชียลมีเดียแต่ละค่าย (LINE, Facebook, Instagram, TikTok) แบบพิกเซลต่อพิกเซล
- **Canvas Aspect Ratio Engine**: สลับอัตราส่วนรูปภาพ (1:1 Square, 4:5 Vertical, 9:16 Story/Reels) พร้อมระบบปรับแต่ง Branding, ราคา, จุดเด่น (Selling Points) แบบเรียลไทม์
- **High-Resolution Export**: แปลง DOM Component เป็นไฟล์รูปภาพและส่งออกแบบไร้รอยต่อสำหรับเอเจนต์อสังหาฯ นำไปใช้ทำการตลาด

---

## 7. ⚡ TikTok Ingestion & High-Reliability Image Proxy Pipeline

กลไกการส่งต่อรูปภาพทรัพย์สินไปยังโซเชียลมีเดีย API (โดยเฉพาะ TikTok Catalog & Meta API):
- **Direct Supabase CDN Ingestion**: แปลงรูปภาพต้นฉบับให้เป็น JPEG พร้อมอัปโหลดขึ้น Supabase Public CDN โดยตรง ป้องกันปัญหาแพลตฟอร์มภายนอกโหลดภาพไม่สำเร็จจาก URL ชั่วคราว
- **High-Throughput Image Proxy (`/api/proxy`)**:
  - กำหนดแคชระดับ HTTP Proxy: `Cache-Control: public, max-age=31536000, immutable`
  - รองรับ `ETag`, `Last-Modified` และ `HEAD` Request เพื่อลดภาระ Data Transfer (Egress)
  - ข้ามผ่าน Middleware Security & Rate Limits เฉพาะส่วนภาพ CDN เพื่อรองรับการดึงภาพพร้อมกันจำนวนมากจาก TikTok/Meta Crawler

---

## 8. 🛡️ Public Lead Submission Security Isolation

ระบบรับข้อมูลฝากขาย/ฝากเช่าจากประชาชนทั่วไป (`features/public/actions.ts`):
- **Honeypot Trap**: ฝัง Field ซ่อนเพื่อดักจับ Bot อัตโนมัติโดยไม่กระทบ User จริง
- **XSS Payload Sanitization**: กรองและทำความสะอาด Input ข้อความทั้งหมดด้วย `isomorphic-dompurify`
- **Distributed IP Rate Limiting**: ควบคุมความถี่การส่งฟอร์มต่อ IP ผ่าน Upstash Redis Rate Limiter
- **Submission Idempotency**: สร้าง Unique Request Hash จากข้อมูลการฝากขาย ป้องกันการกดส่งฟอร์มซ้ำ (Double Submission / Form Spamming)

---

_เอกสารฉบับนี้เป็นเพียงภาพรวมระดับสูง หากต้องการดูโค้ดตัวอย่างในแต่ละส่วน โปรดอ้างอิงจากบทที่ 4-6 ในสารบัญหลัก และ [21_Recent_System_Updates.md](./21_Recent_System_Updates.md)_
