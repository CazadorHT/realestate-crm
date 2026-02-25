# ⚖️ รายการตรวจสอบด้านกฎหมายและ PDPA (Compliance Checklist)

เพื่อให้โปรเจคนี้พร้อมขายในระดับองค์กร (Enterprise) ที่เข้มงวดเรื่องความปลอดภัยของข้อมูลส่วนบุคคล (Data Privacy) ตามกฎหมายไทย

> **อัปเดตล่าสุด:** 25 กุมภาพันธ์ 2026

## 1. การจัดการข้อมูลส่วนบุคคล (Data Handling)

- [x] **Data Minimization:** เราเก็บเฉพาะข้อมูลที่จำเป็น (ชื่อ, เบอร์โทร, LINE ID, งบประมาณ)
- [ ] **Retention Policy:** มีการระบุหรือไม่ว่าข้อมูลลูกค้าจะถูกเก็บไว้กี่ปีหากไม่มีการติดต่อ?
- [x] **Data Encryption:** ข้อมูลเบอร์โทรและอีเมลมีการป้องกันการเข้าถึงจากบุคคลภายนอก (ผ่าน RLS) เรียบร้อยแล้ว

## 2. เอกสารทางกฎหมาย (Legal Documents)

- [x] **Privacy Policy:** หน้าเว็บ `/privacy-policy` ระบุ:
  - ข้อมูลที่เก็บคืออะไร
  - เก็บไว้เพื่ออะไร (เช่น เพื่อการแนะนำทรัพย์)
  - ใครเป็นผู้ประมวลผล (เช่น ใช้ Gemini AI ในการวิเคราะห์)
  - วิธีการขอลบข้อมูล (Right to be Forgotten)
- [x] **Terms of Service:** หน้าเว็บ `/terms` ระบุข้อตกลงการใช้งานระบบโดยละเอียด
- [x] **TikTok Compliance:** มีหน้า Privacy Policy และ Terms of Service เฉพาะสำหรับ TikTok App Review

## 3. ความยินยอม (Consent Management)

- [x] **Cookie Consent:** ระบบแสดง Cookie Consent Banner รองรับ 3 ภาษา (TH/EN/CN) ก่อนเก็บ Cookie
- [x] **Contact Form Consent:** ฟอร์มติดต่อมีการระบุว่าข้อมูลจะถูกใช้เพื่ออะไร
- [x] **AI Chatbot Disclosure:** Chatbot แจ้งให้ผู้ใช้ทราบว่ากำลังสนทนากับ AI

## 4. ความปลอดภัยเชิงระบบ (System Security)

- [x] **Agent Isolation:** ตรวจสอบแล้วว่า Agent A ไม่สามารถมองเห็นเบอร์โทรของลูกค้า Agent B ได้ (ผ่าน RLS)
- [x] **Audit Logs:** ระบบบันทึกไว้เสมอว่าใครเป็นคนเข้ามาดูข้อมูลลูกค้า (ป้องกันการขโมย Database)
- [x] **Access Control:** มีระบบ Manager และ Admin ในการคุมการเข้าถึงข้อมูลพนักงาน

## 5. การจัดการข้อมูลจาก Social Media (Social Data Handling)

- [x] **Facebook/Instagram Data:** ข้อมูลข้อความ (Messages) จาก Meta ถูกเก็บในตาราง `omni_messages` ผ่าน RLS
- [x] **TikTok OAuth:** Token ถูกเก็บอย่างปลอดภัยใน `site_settings` (ไม่เปิดเผยต่อ Client-side)
- [x] **Comment Data:** ข้อมูลคอมเมนต์จาก Facebook/Instagram ที่ถูก Keyword Automation ตอบกลับจะไม่ถูกเก็บถาวร
- [ ] **Third-party Data Agreement:** ควรทำ DPA กับ Meta/TikTok สำหรับการใช้งานข้อมูลผู้ใช้ (สำหรับระดับ Enterprise)

---

## 💡 คำแนะนำสำหรับการขาย

ผู้ซื้อระดับองค์กรมักจะถามหา **"Data Processing Agreement (DPA)"** หากคุณเตรียมร่างสัญญานี้ไว้พร้อมกับตัวระบบ จะช่วยเพิ่มความน่าเชื่อถือและเพิ่มมูลค่าการขายได้อีกมากครับ!
