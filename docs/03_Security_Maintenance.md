# 🛡️ ความปลอดภัยและการดูแลระบบ (Security & Maintenance)

คู่มือการตรวจสอบความปลอดภัย การดูแลรักษาเครื่อง และการแก้ไขปัญหาเบื้องต้น (Enterprise Edition)

> **อัปเดตล่าสุด:** 4 มีนาคม 2026 (Enterprise v2.0 & Multi-Branch Ready)

---

## 1. มาตรฐานความปลอดภัยระดับองค์กร (Enterprise Security)

ระบบได้รับการออกแบบตามมาตรฐาน **OWASP Top Ten** และรองรับ **PDPA** อย่างสมบูรณ์:

- **Row Level Security (RLS) & Multi-Tenant Isolation:**
  - ข้อมูลถูกแยกตาม `tenant_id` (ID ของบริษัท/สาขา) ในระดับ Query ของ PostgreSQL
  - พนักงานสาขา A จะไม่มีทางเห็นข้อมูลสาขา B แม้จะพยายามเปลี่ยน URL หรือเรียกผ่าน API โดยตรง
  - ระบบตรวจสอบสิทธิ์ผ่าน Supabase Auth Hook ร่วมกับ `tenant_members` table
- **Advanced Audit Trail:** บันทึกกิจกรรมสำคัญพร้อมระบุผู้ทำ, วันเวลา และรายละเอียดการเปลี่ยนแปลง (เช่น ใครโอน Lead ให้ใคร, ใครลบรูปทรัพย์สิน)
- **Data Cleanup Policy:** ใช้ `pg_cron` ในการลบ Audit Logs ที่เก่าเกิน 1 ปี และแจ้งเตือนที่อ่านแล้ว เพื่อประสิทธิภาพสูงสุด
- **Proactive Error Handling:** ระบบมี "Safe Mode" (Error Boundaries) เพื่อป้องกันหน้าจอค้างหาก API ภายนอกขัดข้อง

---

## 2. ความปลอดภัยของข้อมูล AI และเอกสาร

### 🤖 AI Data Privacy

- ข้อมูลที่ส่งไปยัง Gemini API จะไม่ถูกนำไป Train Model ต่อ (อิงตาม Enterprise API Terms)
- ระบบเก็บ Log เฉพาะจำนวน Token (Prompt/Completion) และต้นทุนเงินบาท (32 THB/USD) เพื่อการตรวจสอบทางการเงิน

### 📄 Document Security

- **HTML-to-Base64:** รูปภาพในเอกสารจะถูกฝังเป็น Base64 ป้องกันการเข้าถึงไฟล์รูปภาพโดยตรงจากภายนอก
- **Signed URL:** การเข้าดูไฟล์ใน Storage ต้องผ่าน URL ที่มีอายุจำกัด (Expiring Link) เท่านั้น
- **E-Signature Audit:** บันทึก IP Address และ Digital Fingerprint ของผู้ลงนามเพื่อใช้เป็นหลักฐานทางกฎหมาย

---

## 3. การบำรุงรักษาเชิงรุก (Proactive Maintenance)

| กิจกรรม (Activity) | ความถี่    | รายละเอียด                                              |
| :----------------- | :--------- | :------------------------------------------------------ |
| **Cleanup Trash**  | ทุกวัน     | รัน `api/cron/trash-cleanup` ลบข้อมูลที่ถูก Soft-delete |
| **Token Review**   | ทุก 60 วัน | ต่ออายุ Meta Long-lived Page Access Token               |
| **Audit Review**   | ทุกเดือน   | Admin ตรวจสอบประวัติการเข้าใช้งานที่ผิดปกติ             |
| **AI Cost Audit**  | ทุกสัปดาห์ | ตรวจสอบยอด AI Investment ในหน้า Monitor                 |

---

_คู่มือฉบับนี้จัดทำขึ้นโดยระบบ Antigravity AI สำหรับทีมผู้บริหาร VC Connect Asset_
