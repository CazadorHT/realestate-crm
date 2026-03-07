# 📈 แผนการตลาดและการติดตามข้อมูลด้วย AI (AI-Driven Marketing & Analytics Plan)

เอกสารฉบับนี้อธิบายถึงวิสัยทัศน์และแผนการนำเทคโนโลยี AI มาผสานรวมกับระบบ Tracking (GA4 & GTM) เพื่อยกระดับการวิเคราะห์ข้อมูลและเพิ่มประสิทธิภาพการขายของ VC Connect Asset CRM ให้ฉลาดและแม่นยำยิ่งขึ้น

---

## 1. แนวคิดหลัก (Core Concepts)

การทำ Tracking แบบดั้งเดิม (เช่น ดูแค่ยอดวิวปกติ) อาจไม่เพียงพอสำหรับการแข่งขันในยุคปัจจุบัน แผนงานนี้จึงมุ่งเน้นที่การนำ **ข้อมูลพฤติกรรมลูกค้า (Behavioral Data)** จาก Google Analytics 4 (GA4) ผ่าน Google Tag Manager (GTM) มาผสานกับ **AI Engine (Gemini)** ของระบบ CRM

### เป้าหมาย (Objectives)

- **Data to Insights:** เปลี่ยนข้อมูลดิบ (Raw Data) ให้กลายเป็นคำแนะนำเชิงกลยุทธ์ (Actionable Insights)
- **Predictive Marketing:** คาดเดาความต้องการของลูกค้าก่อนที่ลูกค้าจะทักเข้ามา
- **Automated Optimization:** ลดภาระของทีมการตลาดในการนั่งวิเคราะห์กราฟด้วยตัวเอง

---

## 2. โครงสร้างระบบ (Architecture)

1. **Google Tag Manager (GTM):**
   - ทำหน้าที่เป็น "ศูนย์กลาง" ฝังคำสั่ง Tracking ไว้ในทุกปุ่มสำคัญบนเว็บไซต์ (Reveal Phone, Add to Favorite, Chat คลิก)
   - ดักจับ Event และ Parameters เชิงลึก (เช่น `property_type`, `price_range`, `location`)

2. **Google Analytics 4 (GA4) + BigQuery:**
   - เก็บข้อมูล Event แบบมหาศาลและหา Data Pattern
   - ส่งออกข้อมูลระดับดิบ (Raw Data) ไปยัง Data Warehouse (BigQuery/Supabase)

3. **CRM AI Engine (Gemini 2.0):**
   - ดึงข้อมูลจากฐานข้อมูลมาวิเคราะห์รายสัปดาห์
   - สรุปผลและแจ้งเตือนผ่าน Dashboard หรือข้อความ LINE ไปยังทีมบริหาร

---

## 3. แผนการพัฒนาและฟีเจอร์ AI Marketing (Phases)

### Phase 1: Foundation (การวางรากฐาน Tracking)

> **เป้าหมาย:** เก็บข้อมูลให้ถูกต้อง ครบถ้วน และถูกกฎหมาย (PDPA)

- [x] **GTM Setup:** ติดตั้ง GTM Container ในระบบ Next.js (`app/layout.tsx`)
- [x] **Data Layer Implementation:** ฝัง Data Layer ตัวแปรข้อมูลอสังหาฯ ในหน้า Property Detail (เช่น ข้อมูลราคา, ทำเล, ชื่อโครงการ) ส่งเข้า GTM
- [x] **Micro-conversion Tracking:** จับอีเวนต์สำคัญ (กดดูเบอร์โทร, ทักแชท LINE, เลื่อนดูรูปภาพครบทุกรูป)
- [x] **Consent Mode V2:** เชื่อม Cookie Consent ของแอปเข้ากับ Google Consent Mode เพื่อให้การเก็บสถิติสอดคล้องกับ PDPA 100%

### Phase 2: AI Intelligence (การวิเคราะห์ด้วย AI)

> **เป้าหมาย:** นำข้อมูลที่เก็บได้มาให้ AI สรุปและคาดการณ์

- [ ] **AI Lead Scoring:** เมื่อ Lead ทักเข้ามา ระบบ AI จะดึง Historical Data (ถ้ามี) มาประเมิน "โอกาสปิดการขาย" (คะแนน 1-100) โดยดูจากพฤติกรรมบนเว็บ เช่น หากดูแปลนห้องนานกว่า 3 นาที ให้คะแนน +20
- [ ] **AI Marketing Briefing:** สรุป Report รายสัปดาห์ผ่าน Executive Dashboard เช่น _"สัปดาห์นี้ ทรัพย์ประเภทคอนโดในโซนอารีย์ มีคนค้นหาและกดดูเบอร์โทรศัพท์เพิ่มขึ้น 45% แนะนำให้ยิง Ads Facebook เพิ่มในกลุ่มเป้าหมายนี้"_
- [ ] **Smart Retargeting List:** AI ช่วยสร้าง Segment ของกลุ่มลูกค้าที่ "เกือบจะซื้อ" (Add Favorite แต่ไม่ทัก) เพื่อให้ทีมการตลาดนำไปทำ Lookalike หรือ Retargeting ต่อบน Meta/TikTok

### Phase 3: Autonomous Marketing (การตลาดอัตโนมัติ 100%)

> **เป้าหมาย:** ระบบทำงานการตลาดพื้นฐานเองได้

- [ ] **Dynamic Ad Copy Generation:** AI นำข้อมูลว่าทำเลไหนกำลังฮิตจาก GA4 มาแต่งโฆษณา (Ad Copy) และสร้างแคมเปญให้เซลส์ก๊อปปี้ไปยิง Ads ได้ทันที
- [ ] **Personalized Property Recommendation:** ปรับสลับตำแหน่งหน้าจอ Home Page หากระบบจำได้ว่าผู้ใช้นี้เคยค้นหาบ้านเดี่ยวเกิน 3 ครั้ง หน้าเว็บจะดันบ้านเดี่ยวแนะนำของ AI ขึ้นมาข้างบนสุดทันที

---

## 4. ประโยชน์แบบรูปธรรม (Value Proposition)

- **ลดต้นทุนโฆษณา (Lower CAC):** ยิงโฆษณาเข้าเป้ามากขึ้น เพราะ AI ช่วยวิเคราะห์ว่าลูกค้า Segment ไหนมีโอกาสซื้อสูงสุด (Quality leads vs Junk leads)
- **ประหยัดค่าจ้าง Data Analyst:** ฟีเจอร์ AI Marketing Briefing ทำหน้าที่เสมือนมีนักวิเคราะห์ข้อมูลประจำบริษัท
- **สร้างจุดขายสุดล้ำระดับ Enterprise:** การมีระบบ CRM ที่ใช้ GTM/GA4 + AI Scoring ถือเป็น Killer Feature ที่เหนือกว่า CRM อสังหาฯ ทั่วไปในไทยอย่างมาก
