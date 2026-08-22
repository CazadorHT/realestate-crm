# 🔐 11: ตำราคุมขัง API โซเชียล (Meta & TikTok Token Security Guide)

> **เทคโนโลยีหลัก:** HMAC Webhook Authentication, Automatic Token Rotation, Supabase CDN Proxy
> **อัปเดตล่าสุด:** 22 สิงหาคม 2026 (Enterprise v4.0 - August 2026 Release)
> **เป้าหมาย:** สัญญาณเตือนภัยและวิธีรับมือ เมื่อบริษัทยักษ์ใหญ่ปรับเปลี่ยนกติกา

การผูกชีวิตไว้กับ Facebook (Meta) และ TikTok API คือเรื่องน่าปวดหัวของทีม Developer เพราะ Token จะมีวันหมดอายุ หรือโดนระงับกะทันหันถ้าระบบเขาตรวจพบพฤติกรรมแปลกๆ

---

## 1. Token Rotation Life-Support (ปอดเหล็กเลี้ยง Token)

แอดมินหรือ Owner ไม่ควรต้องมากดขอรหัส API ใหม่ทุกๆ 60 วัน 

### 1.1 กระบวนการต่ออายุเงียบ (Silent Renewal)
- ทันทีที่ระบบได้รับ Token ระยะยาว (Long-Lived Access Token) อายุ 60 วัน โค้ด Inngest Cron จะตั้งเวลาปลุกตัวเองในวันที่ 50
- มันจะแอบยิง API กลับไปหา Facebook เพื่อขอสลับรับ (Exchange) Token ตัวใหม่มาทับตัวเก่าอัตโนมัติ 
- ตลอดชีวิตการใช้งานของบริษัท (ตราบใดที่ Facebook ไม่เด้งรหัสผ่าน) แอดมินไม่ต้องรู้สึกรู้สาเรื่อง Token หมดอายุเลย

---

## 2. API Health Dashboard (จอภาพชีพจร)

ปัญหาใหญ่สุดคือเวลาโพสต์ลงเพจไม่ติด เอเยนต์จะหัวเสียและบอกว่า "เว็บพัง!" ทั้งที่จริงเซิร์ฟเวอร์ Facebook ล่ม

### 2.1 The Blame Shield (เกราะปัดความผิด)
ระบบมีหน้าต่าง **Social Status Monitor** ที่ยิง Ping หาเซิร์ฟเวอร์ปลายทาง (เช่น Graph API หรือ TikTok API) 
- ถ้า Facebook ล่ม หน้าเว็บจะขึ้นไฟแดงพร้อมคำอธิบายว่า "Meta API กำลังประสบปัญหา" 
- ถ้าโพสต์พังเพราะรหัสหมดอายุ จะขึ้นว่า "โปรดเชื่อมต่อเฟซบุ๊กใหม่"
- ปิดจบปัญหากินแรงทีม Support ที่ต้องมานั่งรับสายลูกค้าองค์กร

### 2.2 วงแหวนแยกส่วน (Fallback Queue)
การกดแชร์โพสต์จะถูกบรรจุในคิว หากโซเชียลล่ม โค้ด Inngest จะกักตุนโพสต์นั้นไว้และหน่วงเวลาการยิงซ้ำ (Exponential Backoff) เช่น รอ 1 นาที -> 5 นาที -> 30 นาที จนกว่าพายุจะสงบ ช่วยการันตีว่าโพสต์สิบหลังจะไม่หล่นร่วงไปแห่งหนใด

---

## 3. สถาปัตยกรรมส่งภาพความเสถียรสูง (TikTok & Meta CDN Asset Delivery)

แก้ปัญหาการปฏิเสธการดึงรูปภาพของ TikTok Catalog และ Meta Catalog API (`features/properties/actions/tiktok.ts` & `/api/proxy`):
- **Direct Supabase CDN Ingestion**: รูปภาพจะถูกบีบอัดเป็น JPEG และส่งขึ้น Supabase Storage Bucket `social-cards` โดยตรง เพื่อให้ได้ Public Static URL ที่ถาวร ไม่โดนล็อกสิทธิ์
- **Image Proxy Hardening**: เส้นทาง `/api/proxy` ถูกปรับแต่ง HTTP Cache Headers (`Cache-Control: public, max-age=31536000, immutable`, `ETag`, `HEAD` request support) เพื่อให้ระบบของ Meta และ TikTok ดึงรูปภาพได้อย่างราบรื่น 100% โดยไม่ติดขัด

---

_เอกสารความปลอดภัย API โซเชียลปรับปรุงล่าสุดตามมาตรฐาน Enterprise v4.0_
