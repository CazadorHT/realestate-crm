# 🚀 21: รายงานการอัปเดตสถาปัตยกรรมและฟีเจอร์ล่าสุด (Recent System Updates)

> **เวอร์ชันอัปเดต:** Enterprise v4.0 (Latest Release)  
> **เทคโนโลยีที่เกี่ยวข้อง:** Next.js 16.2 (Turbopack), Upstash Redis Rate Limiter, Sharp Image Engine, Supabase Public CDN, DOMPurify, In-Memory Caching  

เอกสารฉบับนี้สรุปฟีเจอร์ใหม่และสถาปัตยกรรมทางเทคนิคที่ถูกยกระดับในโค้ดเบสล่าสุด เพื่อให้ทีมพัฒนาและแอดมินอ้างอิงได้อย่างถูกต้อง

---

## 1. 🎨 Social Studio & Live Asset Generator (`components/social-studio`)

ระบบสร้างและปรับแต่งสื่อการตลาดสำหรับโซเชียลมีเดียในรูปแบบ interactive card studio:
- **Platform Live Previews:**
  - `LinePreview.tsx`: พรีวิวรูปแบบการแชร์บน LINE (Rich Card Layout)
  - `GenericPreview.tsx`: พรีวิวมาตรฐานสำหรับ Facebook, Instagram, และ TikTok
  - `PlatformUiOverlay.tsx`: จำลอง UI เสมือนของแต่ละแอปพลิเคชันเพื่อความแม่นยำ 100%
- **Canvas Aspect Ratio Engine:**
  - สลับสเกลภาพแบบไดนามิก (1:1, 4:5, 9:16)
  - ปรับแต่งคำโปรย, Selling Points, โลโก้แบรนด์, และธีมสีของการ์ดได้ในหน้าเดียว
- **Direct Social Syndication & Share:**
  - เชื่อมต่อตรงกับ `features/properties/actions/social.ts` ส่งออกรูปภาพความละเอียดสูงเพื่อแชร์หรือดาวน์โหลดลงเครื่องทันที

---

## 2. 🛡️ Public Lead Submission Security Isolation (`features/public/actions.ts`)

ยกระดับความปลอดภัยให้ฟอร์มรับฝากขาย/ฝากเช่าจากประชาชนทั่วไปเพื่อป้องกัน Bot, Spam และการโจมตีทางไซเบอร์:
- **Honeypot Trap:** ดักจับ Automated Bot ที่แอบเติม Field ซ่อนในแบบฟอร์ม
- **DOMPurify XSS Protection:** กรองและล้างอักขระพิเศษปนเปื้อนในทุกข้อความ Input ด้วย `isomorphic-dompurify`
- **Upstash Redis Rate Limiting:** ควบคุมความถี่การส่งแบบฟอร์มตาม IP Address ป้องกัน Denial of Service (DoS)
- **Submission Hash Idempotency:** คำนวณ Unique Hash จากข้อมูลฝากขาย ป้องกันการกดส่งฟอร์มซ้ำซ้อนภายในระยะเวลาสั้น
- **Property Image Uploading:** รองรับการอัปโหลดไฟล์ภาพอสังหาฯ ของผู้ฝากขายผ่าน Drag-and-Drop พร้อมระบบบีบอัดภาพก่อนส่งขึ้น Storage

---

## 3. ⚡ TikTok Ingestion & High-Reliability Image Proxy (`/api/proxy` & `tiktok.ts`)

แก้ปัญหาขอบเขตการดึงภาพจากภายนอกของ TikTok Catalog API และ Meta Catalog API:
- **Direct Supabase CDN Ingestion:** แปลงไฟล์ภาพเป็น JPEG ความคมชัดสูงและอัปโหลดเข้าสู่ Supabase CDN โดยตรงก่อนส่ง URL ให้ TikTok API ป้องกันภาพหมดอายุหรือ URL หลุด Scope
- **Image Proxy Caching Standard (`/api/proxy`):**
  - **Headers:** `Cache-Control: public, max-age=31536000, immutable`
  - **HTTP Validation:** เพิ่มการรองรับ `ETag`, `Last-Modified` และ `HEAD` Request
  - **Middleware Bypass:** กำหนดข้อยกเว้นการกรองใน Middleware สำหรับภาพ CDN เพื่อให้ดึงภาพไปประมวลผลได้อย่างรวดเร็วโดยไม่ติด Rate Limit

---

## 4. 📍 Popular Area Management Engine (`features/properties/actions/popular-areas.ts`)

ระบบบริหารจัดการพื้นที่ยอดนิยมเพื่อเพิ่มประสิทธิภาพการค้นหาของลูกค้า:
- **Dynamic Hotspot Configuration:** แอดมินสามารถจัดการรายชื่อทำเลทอง (Popular Areas) พร้อมพิกัด และ Keyword อ้างอิง
- **Integration with MagicAiSearch:** เชื่อมต่อทำเลทองเข้ากับเอนจินค้นหาด้วยภาษาธรรมชาติ (`MagicAiSearch`) เพื่อแนะนำทำเลที่สอดคล้องกับงบประมาณและไลฟ์สไตล์ของลูกค้าอัตโนมัติ

---

## 5. ⚡ Performance Caching & SEO Enhancements

เพิ่มความเร็วในการโหลดหน้าเว็บและปรับปรุงคะแนน SEO ตามมาตรฐาน Core Web Vitals:
- **Sharp Image Optimization Engine:** ใช้ `sharp` ในการย่อขนาด บีบอัด และจัดรูปแบบภาพ WebP/AVIF แบบไดนามิก
- **In-Memory Caching Strategy:** Caching ข้อมูลระบบและข้อมูลผู้ใช้งานที่เข้าถึงบ่อยในหน่วยความจำ (`lib/actions/system-config.ts`) ช่วยลดภาระ Egress และการ Query สู่ฐานข้อมูล
- **Next.js `unstable_cache` & Database Facets:** ใช้ `unstable_cache` ในการแคชรายการอสังหาฯ ฝั่งสาธารณะ พร้อมคำนวณจำนวน Filter Facet แบบไดนามิกจากฐานข้อมูล
- **SEO Rich Snippets (Breadcrumb JSON-LD):** สร้าง Breadcrumb Schema อัตโนมัติในหน้า Property Detail พร้อมปรับปรุง Dynamic Image Sitemap เพื่อเพิ่มโอกาสติดอันดับค้นหาบน Google Search

---

_เอกสารฉบับนี้จัดทำขึ้น ณ วันที่ 22 สิงหาคม 2026 เพื่อใช้เป็นมาตรฐานระบบ Enterprise v4.0_
