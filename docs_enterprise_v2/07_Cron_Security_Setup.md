# ⏱️ 07: ระบบประมวลผลเบื้องหลังและห้องควบคุมอัจฉริยะ (Process Monitor & Background Resilience)

> **เครื่องยนต์ประมวลผล:** Inngest, Vercel Cron, Unified Process Engine
> **อัปเดตล่าสุด:** 22 สิงหาคม 2026 (Enterprise v4.0 - August 2026 Release)
> **แนวทางการออกแบบ:** Enterprise Transparency — เปลี่ยนงานเบื้องหลังที่ "มองไม่เห็น" ให้กลายเป็น "ห้องควบคุมที่ตรวจสอบได้"

ในระบบ Enterprise ระดับราคา 38M - 53M+ THB ความน่าเชื่อถือ (Reliability) ไม่ได้หมายถึงแค่ระบบไม่ล่ม แต่หมายถึง **"ผู้ใช้ต้องรู้เสมอว่าระบบกำลังทำอะไรอยู่"** แม้จะเป็นงานที่รันอยู่ในเบื้องหลังก็ตาม เราจึงปฏิรูประบบจากเดิมที่ใช้เพียงการแจ้งเตือนชั่วคราว (Ephemeral Toasts) สู่สถาปัตยกรรม **Unified Process Monitor**

---

## 1. สถาปัตยกรรม Queue ทะลวงกำแพง Serverless (Inngest Logic)

Vercel มีกฎจำกัด 10-30 วินาที สำหรับคำสั่ง API ปกติ หากคุณรันสคริปต์ที่ใช้เวลานานโค้ดจะถูกระเบิดทิ้งระหว่างทาง เราจึงใช้ **Event-Driven Architecture** เพื่อความเสถียรสูงสุด

### 1.1 Inngest: ท่อส่งงานอัจฉริยะ (The Smart Job Orchestrator)
ทุกครั้งที่เกิดคำสั่งใหญ่ (เช่น สั่งให้ AI เขียนประกาศบ้านภาษาจีน, การอัปโหลดรูปภาพ Batch ใหญ่, การแปลงภาพ Social Studio หรือการอัปโหลด CDN สำหรับ TikTok Catalog) ระบบจะทำงานแบบ **Non-blocking**:
- **Event Dispatching**: คำสั่งถูกห่อหุ้มเป็น Event Payload (เช่น `ai/content.generate`, `tiktok/image.convert`, `social/card.export`) และส่งเข้าคิว Inngest ทันที
- **Automatic Retry & Durability**: หาก Server AI ของ Google Gemini, TikTok API หรือ Meta API ขัดข้อง Inngest จะทำการ Retry อัตโนมัติด้วย Exponential Backoff ป้องกันงานสูญหาย 100%

---

## 2. Unified Process Monitor: ห้องควบคุมอัจฉริยะ (The Control Room UI)

นี่คือฟีเจอร์ระดับ Diamond ที่ช่วยยกระดับ UX ให้เป็นมืออาชีพ โดยการเปลี่ยน Background Tasks ให้กลายเป็น Visual History ที่ตรวจสอบได้

### 2.1 Centralized Monitoring Hub
ระบบถูกออกแบบให้มี **Floating Control Room** (ปุ่มวงกลมอัจฉริยะมุมขวาล่าง) ที่คอยดักฟัง Event จากทั่วทั้งแอปพลิเคชัน:
- **Real-time Progress**: แสดงสถานะงานที่กำลังรันอยู่ (Processing) แบบเรียลไทม์ เช่น "อัปโหลดรูปภาพ 4/20 รูป" หรือ "AI กำลังแปลภาษาบทความ"
- **Task Isolation**: แยกแยะประเภทงานชัดเจน (Social Posting, Social Studio Export, AI Gen, Maintenance) พร้อม Icon เฉพาะตัว

### 2.2 Background Resilience & Recovery
- **Audit-ready History**: ผู้ใช้สามารถย้อนดูประวัติงานที่ทำสำเร็จแล้ว หรือตรวจสอบ Error รายละเอียดสูงได้ทันทีหากงานล้มเหลว
- **One-click Retry**: หากงานติดขัด ระบบอนุญาตให้แอดมินกด "Retry" งานนั้นๆ ได้โดยตรงจากหน้า Monitor โดยไม่ต้องกลับไปตั้งต้นใหม่ในหน้าเดิม

---

## 3. ระบบตื่นนอนทำงานอัตโนมัติ (Cron Jobs Infrastructure)

การเป็น "ผู้ดูแลแทนคน" คือคอนเซปท์ของ Enterprise CRM ไม่ใช่แค่การเก็บข้อมูล แต่ต้องมีการกระทำ (Action) อัตโนมัติ:

### 3.1 Vercel Edge Cron & AI Market Alerts
- **AI Market Analytics**: ทุกเช้าตี 3 ระบบจะปิงผ่าน Cron เพื่อเปรียบเทียบราคาดีลในตลาด หากพบความผิดปกติหรือโอกาสในการลงทุน ระบบจะตบงานลง Monitor แจ้งเตือนแอดมิน
- **Automated Retention & Contract Renewal**: กวาดดูสัญญาที่กำลังจะหมดอายุในเดือนถัดไป และสั่งยิง LINE Flex Message แจ้งเตือนลูกค้าอัติโนมัติผ่านคิวเบื้องหลัง
- **Cache Revalidation**: รีเฟรชข้อมูล Facet Counts และพื้นที่ยอดนิยม (Popular Areas) ในหน่วยความจำเพื่อลด Latency ในการค้นหา

### 3.2 Security Shield
Endpoint ของงานอัตโนมัติถูกปกป้องด้วย **`CRON_SECRET` Layer** ป้องกันการยิงถล่มจากภายนอก (Unauthorized Access) หาก Secret Key ไม่ตรงเป๊ะ ระบบจะ Reject ทันทีด้วยรหัส 401 Unauthorized เพื่อความปลอดภัยสูงสุด

---

_เอกสารระบบประมวลผลเบื้องหลังปรับปรุงล่าสุดตามมาตรฐาน Enterprise v4.0_
