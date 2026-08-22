# 🤝 06: คัมภีร์รับมอบระบบทางเทคนิค (Technical Handover Guide)

> **สำหรับ:** หัวหน้าทีมพัฒนา (Engineering Manager) หรือทีมนักพัฒนาซอฟต์แวร์ชุดใหม่
> **คำเตือนศิลาจารึก:** ระบบนี้ทรงพลังเพราะมีการวาง "รหัสเงียบ (Implicit Logic)" ไว้มากมาย โปรดอ่านโดยละเอียดก่อนแก้ไขโค้ดใดๆ

การรับช่วงต่อโปรเจคระดับนี้ ไม่ใช่แค่เก่ง React แล้วจะรอด เพราะโค้ดร้อยละ 40 เป็นสถาปัตยกรรมระดับ Database และ Pipeline การส่งมอบ (Handover) นี้ทำเพื่อป้องกัน "ทีมใหม่เขียนโค้ดทำลายความมั่นคงของทีมเก่า"

---

## 1. The "Black Magic" Warnings (มนตร์ดำที่ห้ามไปแตะต้อง)

### 1.1 ศูนย์กลางความขลัง `Repository Proxy`
- **กฎเหล็ก:** ห้ามใช้ `supabase.from('table')` แบบดิบๆ ยิงตรงจาก Component หรือ Server Actions เด็ดขาด! 
- **เหตุผล:** ระบบรันสภาพแวดล้อม Multi-tenant การคิวรีทุกอย่างถูกบังคับให้วิ่งผ่าน **Proxy ES6 Object** ที่หุ้มคำสั่ง `.eq('tenant_id', ...)` เอาไว้ หากคุณบังคับข้าม (Bypass) ไปดึงข้อมูลเอง อาจทำให้หน้าบ้านมีข้อมูลของบริษัทอื่นหลุดรอดไปผสมด้วย ซึ่งคุณจะโดนฟ้องร้อง PDPA

### 1.2 PostgreSQL RPC (สัจธรรมของข้อมูล)
- หากมีบั๊กเรื่อง "กดอัปเดตสเตตัสบ้านไม่ได้" **ห้าม!** พยายามไปแก้ Logic ที่ไฟล์ `.ts` ฝั่ง Node.js
- ขบวนการตัดสต็อกถูกฝังเป็นแพ็กเกจ (Atomic Data) ลงลึกในสคริปต์ Database RPC (`features/database/rpc/`) คุณต้องเข้าไปแก้ SQL Script แล้วรัน Migration ใหม่ เพราะ Server ไม่มีสิทธิ์ตัดสินใจขัดพื้นฐานโครงสร้าง Database ที่ใช้เทคนิค Optimistic Locking ครับ

---

## 2. ขุมทรัพย์ Environment Variables (ประตูห้องนิรภัย)

ระบบมีการใช้ 3rd-Party ทรงพลังหลายตัว โปรดรักษารหัส Environment ให้ดี:
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: ควบคุม Rate Limit (IP throttling) ของแบบฟอร์ม Public และ Webhook Idempotency
- `INNGEST_EVENT_KEY`: ช่องทางส่ง Event ประมวลผลเบื้องหลัง (AI Generation, Social Posting)
- `CRON_SECRET`: รหัสสำหรับตารางตั้งเวลารัน Background Jobs
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: กุญแจเชื่อมต่อ Supabase Storage Buckets (`property-images`, `social-cards`)

---

## 3. กฎระเบียบ Middleware & Image Proxy Bypass (`lib/supabase/middleware.ts`)

- **Image Proxy Route (`/api/proxy`)**: ถูกยกเว้นจากการกรอง Session และ Rate Limit ของ Middleware เพื่อให้ TikTok Catalog API และ Meta Crawler ดึงไฟล์ภาพไปใช้งานได้โดยไม่ถูกบล็อก
- **HTTP Header Control**: มีการบังคับใส่ `Cache-Control: public, max-age=31536000, immutable` ร่วมกับ `ETag` และ `Last-Modified` เพื่อลด Egress Bandwidth และความซ้ำซ้อนของการประมวลผลภาพ

---

## 4. ขั้นตอนการตั้งศูนย์ (On-boarding Local Development)

**การรัน Dev Mode จะไม่สมบูรณ์หากคุณไม่ได้จำลองฐานข้อมูล:**
1. ติดตั้ง Supabase CLI ในเครื่อง
2. รันคำสั่ง `supabase start` เพื่อจำลอง Database + Trigger + RPC ลงใน Local Docker
3. เวลาคุณเขียน Unit Test ด้วย `vitest` หน้าบ้าน ให้ยิงพุ่งเป้าไปที่ Local DB เพื่อให้ RLS ทำงานสมบูรณ์
4. ระบบฝัง Warning Flag ไว้ใน Console โหมด Dev หากมีการเรียกใช้คำสั่งคิวรีตรงโดยไม่ผ่าน ES6 Proxy

---

_โปรดอ้างอิงและปฏิบัติตามมาตรฐานสถาปัตยกรรมเพื่อความปลอดภัยและเสถียรภาพสูงสุดของระบบ_
