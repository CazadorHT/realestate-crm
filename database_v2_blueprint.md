# 🏗️ Blueprint: Real Estate CRM Database V2 (Global Scaling Edition)

เอกสารฉบับนี้คือแผนปฏิวัติโครงสร้างฐานข้อมูล เพื่อความเร็วระดับ Enterprise และรองรับการสเกลในระดับ Global (Multi-Region / Multi-Branch)

---

## 🌍 1. Global Paradigm Shifts (มาตรฐานสากล)

### 1.1 🌐 Global JSONB Translation [❌]
*   ยกเลิกคอลัมน์ `_en`, `_cn`, `_ru` ทั้งหมด ใช้ `title JSONB` และ `description JSONB` เพื่อรองรับการเพิ่มภาษาใหม่ได้ทันทีโดยไม่ต้องแก้ Schema

### 1.2 📁 Unified Polymorphic Media [❌]
*   รวมรูปภาพและเอกสารเข้าสู่ตาราง `media_assets` ตารางเดียว พร้อมระบบ AI Metadata และ Scan Results

---

## 🏢 2. Multi-Branch & Organization [❌]

*   **❌ แบบเก่า (Old Way):** ข้อมูลสาขาถูกฝังอยู่ใน Text หรือต้องแยก Tenant ใหม่ทุกครั้งที่เปิดออฟฟิศเพิ่ม ทำให้จัดการภาพรวมบริษัทลำบาก
*   **✅ แบบใหม่ (V2 Way):**
    ```sql
    CREATE TABLE branches (
        id UUID PRIMARY KEY,
        tenant_id UUID, -- บริษัทแม่
        name JSONB,     -- {"th": "สาขาสิงคโปร์", "en": "Singapore"}
        location GEOGRAPHY(POINT) -- พิกัดสาขาจริง
    );
    ```
*   **สิทธิ์การเข้าถึง:** Branch Manager เห็นเฉพาะข้อมูลสาขาตัวเอง, Company Admin เห็นทั้งหมด

---

## 📊 3. Performance & AI Infrastructure [❌]

*   **❌ แบบเก่า (Old Way):** เก็บ `latitude` และ `longitude` เป็น Numeric/Float ธรรมดา ค้นหาในรัศมี (Radius) ได้ช้ามากเพราะต้องคำนวณสูตรคณิตศาสตร์สดๆ ทุกครั้ง
*   **✅ แบบใหม่ (V2 Way):**
    ```sql
    location GEOGRAPHY(POINT),
    -- สร้าง GIST Index ทำให้ค้นหา "บ้านรอบตัวฉัน 1 กม." เสร็จใน 0.001 วินาที
    ```

*   **❌ แบบเก่า (Old Way):** มีแค่คอลัมน์ `original_price` เก็บราคาแรกเริ่มตัวเดียว ไม่เห็นประวัติการขึ้นลงระหว่างทาง
*   **✅ แบบใหม่ (V2 Way):**
    ```sql
    CREATE TABLE property_price_history (
        property_id UUID,
        price NUMERIC,
        changed_at TIMESTAMPTZ DEFAULT now()
    );
    -- ใช้ทำกราฟ Market Trend ให้ลูกค้าดูได้ทันที
    ```

---

## 🔐 4. Security & Privacy [❌]

*   **❌ แบบเก่า (Old Way):** ข้อมูลคนหนึ่งคนแยกกันอยู่ตามตาราง (Owner, Lead, Profile) ทำให้ไม่รู้ว่าใครคือใครจริงๆ
*   **✅ แบบใหม่ (V2 Way):**
    ```sql
    CREATE TABLE identities (
        id UUID PRIMARY KEY,
        full_name_encrypted TEXT, -- เข้ารหัส PDPA
        identity_type TEXT,       -- 'AGENT', 'OWNER', 'VIP_CLIENT'
        global_score NUMERIC      -- คะแนนความน่าเชื่อถือ
    );
    ```
*   **ผลลัพธ์:** เห็นเส้นทางลูกค้า (Customer Journey) ทั้งหมดในที่เดียว

### 🛡️ 4.2 PDPA Field-Level Encryption
*   เข้ารหัสข้อมูล Sensitive (เบอร์โทร, อีเมลจริง) ในระดับ Database โดยใช้ Supabase Vault

---

## ✨ 5. Enterprise Patterns [⚠️]

### 5.1 📈 Pre-Aggregated Branch Analytics
*   ใช้ Trigger อัปเดตยอดขายและจำนวน Listing แยกตาม "สาขา" (Branch) แบบ Real-time เพื่อให้หน้า Dashboard ของผู้บริหารโหลดได้ทันที

### 5.2 🤖 AI-Native Pipeline Tasks
*   คิวงานพิเศษสำหรับ AI: Image Staging, Blog Writer, และการคำนวณ Match Score รายวัน

---

## 🚀 6. Infrastructure Roadmap [❌]

### 6.1 📏 Resource Quotas & Metering
*   ระบบคุมโควตาการใช้งาน (เช่น สาขานี้ลงประกาศได้สูงสุด 500 ห้อง) และการคุมงบประมาณ AI Tokens

### 6.2 🌉 The View Pattern Migration
*   ใช้ Database Views เพื่อให้ Code เดิมทำงานต่อได้ 100% ระหว่างที่เราย้ายข้อมูลไปยังโครงสร้างใหม่

---

## 💰 7. Financial & Business Logic [⚠️]

### 7.1 🧾 Immutable Ledger [❌]
*   ระบบบัญชีแบบบันทึกต่อท้ายเท่านั้น (Append-only) ห้ามแก้ไขยอดเงินเดิม เพื่อป้องกันการทุจริต

### 📱 7.2 Omni-Channel Unified Messaging [✅]
*   รวมแชทจาก Line, FB, IG เข้าสู่ตารางเดียวและผูกกับ Lead ID อัตโนมัติ

### 🏘️ 7.3 Smart Property Syndication [✅]
*   ระบบจัดการสถานะการโพสต์ไปเว็บนอก (LivingInsider, DDProperty) แยกออกจากตารางหลัก เพื่อความสะอาดของข้อมูล

---

## 🛡️ 8. Legacy Feature Integrity [✅]

เพื่อให้มั่นใจว่าฟีเจอร์เดิมทั้งหมดใน 4,900 บรรทัดของ `database.types.ts` จะไม่หายไป เราขอยืนยันสถานะของโมดูลสำคัญดังนี้:

*   **Marketing Content (Blogs, FAQs, Partners, Services, Popular Areas):** ยังอยู่ครบ 100% แต่จะถูกอัปเกรดให้ใช้ระบบ **Global JSONB Translation** เพื่อลดความซ้ำซ้อน
*   **CRM Workflow (Activities, Transfers, Notifications, Teams):** ยังอยู่ครบ และจะถูกเชื่อมโยงเข้ากับระบบ **Branch Management** เพื่อให้การทำงานในทีมใหญ่เป็นระเบียบขึ้น
*   **Smart Match Engine (Sessions, Matches, Settings):** อัปเกรดให้ใช้ **Vector HNSW Indexing** เพื่อการจับคู่ที่เร็วและฉลาดขึ้น
*   **Transit & Location (Stations, Distances):** อัปเกรดจาก String-based เป็น **PostGIS Geography** เพื่อความแม่นยำสูงสุดในการค้นหาบ้านใกล้รถไฟฟ้า

---

## 🧠 9. RPC & Function Evolution [❌]

ฟังก์ชันการทำงานเดิม (Stored Procedures) จะถูกเขียนใหม่ให้รองรับโครงสร้าง V2:
*   `match_properties` -> จะถูกอัปเกรดเป็น `match_properties_v2` ที่รองรับ Vector + Branch Filtering
*   `get_analytics_summary` -> จะเปลี่ยนจากการ Count สดๆ เป็นการดึงจาก **Pre-Aggregated Rollup Tables**
*   `bulk_operations` -> จะรองรับการทำงานแบบ Multi-tenant และ Branch-aware เพื่อความปลอดภัย

---
**บทสรุป:** พิมพ์เขียวฉบับนี้คือการ **"รื้อเพื่อสร้างใหม่ให้แข็งแรงกว่าเดิม"** โดยไม่มีการทิ้งฟีเจอร์หรือข้อมูลสำคัญใดๆ แม้แต่บรรทัดเดียวครับ!
---

## 🔌 10. Webhooks & Event-Driven Architecture [⚠️]

*   **Logic Separation:** แยก Business Logic ซับซ้อนออกจาก Main API โดยใช้ Postgres Triggers + Supabase Edge Functions (เช่น เมื่อปิดดีล -> ส่งข้อมูลไปบัญชี -> ส่ง LINE แจ้งเตือนสาขา)

## 🛡️ 11. Row-Level Security (RLS) V2 [❌]

*   **Branch-Aware Security:** นโยบายความปลอดภัยที่เช็กสิทธิ์แบบไขว้ (Cross-check) ระหว่าง `user_role` + `branch_id` + `tenant_id` เพื่อป้องกัน Data Leak ในระดับองค์กรใหญ่

## 🧹 12. Data Archiving & Retention [⚠️]

*   **Cold Storage Strategy:** ข้อมูล Log หรือประวัติการเข้าชมที่เก่ากว่า 1-2 ปี จะถูกย้ายไปยัง Partition พิเศษที่มีการบีบอัดข้อมูล (Compressed) เพื่อประหยัดพื้นที่และรักษาความเร็วของตารางหลัก

## 💰 13. Multi-Currency & Global Finance [⚠️]

*   **Real-time Exchange Rates:** ตาราง `exchange_rates` สำหรับคำนวณราคาขาย/เช่า เป็นสกุลเงินต่างๆ (USD, CNY, EUR) ตามกลุ่มลูกค้าเป้าหมาย
*   **Currency-Aware Reporting:** ระบบรายงานที่แปลงยอดขายจากทุกประเทศ กลับมาเป็นสกุลเงินหลัก (Base Currency) ของบริษัทแม่โดยอัตโนมัติ

## 📈 14. Lead Lifecycle & Routing Engine [❌]

*   **Lead Stage History:** บันทึกการเปลี่ยนแปลงสถานะของ Lead ทุกขั้นตอนเพื่อวัดประสิทธิภาพทีม (Lead Aging) และระบุคอขวดในกระบวนการขาย
*   **Intelligent Routing:** ระบบกระจาย Lead ไปยัง Agent ที่เหมาะสมที่สุดตามสาขา (Branch) หรือความเชี่ยวชาญ (Specialization)

## ✉️ 15. Omni-Channel Template Management [⚠️]

*   **Unified Templates:** ระบบจัดการแม่แบบข้อความเดียวที่ใช้ได้ทั้ง PDF Contract, Email, LINE, และ WhatsApp เพื่อรักษาความเป็นมืออาชีพของแบรนด์ในทุกช่องทาง

## 🧩 16. Metadata-Driven Dynamic Fields [❌]

*   **Property Schema Flex:** ใช้โครงสร้าง JSONB ในการเก็บฟิลด์พิเศษที่แตกต่างกันตามประเภททรัพย์ (เช่น ที่ดินเก็บ "สีผังเมือง", โรงงานเก็บ "กำลังไฟฟ้า") โดยไม่ต้องเพิ่มคอลัมน์ใหม่ในฐานข้อมูล

## 📉 17. JSONB Diff-based Audit Logs [❌]

*   **Storage Efficiency:** เปลี่ยนจากการเก็บ Full Record ใน Audit Logs เป็นการเก็บเฉพาะ **"Changeset" (Diff)** ในรูปแบบ JSONB เพื่อประหยัดพื้นที่จัดเก็บข้อมูลประวัติได้สูงสุด 80%

## ⚡ 18. Database-Level Generated Columns [❌]

*   **Auto-Calculated Fields:** ใช้ `GENERATED ALWAYS AS` สำหรับค่าที่ต้องคำนวณบ่อย เช่น `price_per_sqm` หรือการทำ `full_text_search_vector` เพื่อให้การค้นหาและเรียงลำดับรวดเร็วโดยไม่ต้องคำนวณใน API

## 🧠 19. Semantic Vector Search [⚠️]

*   **Beyond Keywords:** ใช้ `pgvector` เก็บค่า Embeddings ของคุณสมบัติทรัพย์และความต้องการของ Lead เพื่อทำระบบ Matching ที่ "เข้าใจความหมาย" มากกว่าแค่การกรองข้อมูลแบบปกติ

## 🛡️ 20. Native Database Constraints [❌]

*   **Data Integrity:** บังคับใช้ `CHECK CONSTRAINTS` ระดับฐานข้อมูล (เช่น ห้ามราคาเป็นลบ, วันที่สิ้นสุดต้องมากกว่าวันที่เริ่ม) เพื่อป้องกันข้อมูลขยะ (Dirty Data) ที่มักจะเป็นสาเหตุของระบบรวนเมื่อสเกลในอนาคต

## 🔍 21. Unified Global Search Index [❌]

*   **Universal Search:** สร้าง View หรือตาราง Index พิเศษที่รวมข้อมูลสำคัญจาก Leads, Properties, และ Deals ไว้ในที่เดียวเพื่อให้ระบบการค้นหาแบบ Global Search รวดเร็วและแม่นยำระดับ Milliseconds

## 🎭 22. GDPR/PDPA Anonymization Engine [❌]

*   **Secure Privacy:** ระบบลบข้อมูลส่วนตัวตามกฎหมาย PDPA โดยการ "Anonymize" ข้อมูล (เช่น เปลี่ยนชื่อเป็น Anonymous) แต่ยังคงเก็บสถิติตัวเลขไว้เพื่อไม่ให้รายงานสถิติของบริษัทคลาดเคลื่อน

## 📉 23. Predictive Time-on-Market Analytics [❌]

*   **AI Forecasting:** ใช้ประวัติการขายในอดีตมาคำนวณคาดการณ์ระยะเวลาที่ทรัพย์แต่ละประเภทในแต่ละทำเลจะใช้ในการขาย (Average Days on Market) เพื่อเป็นข้อมูลเชิงกลยุทธ์ให้กับ Agent

## 🚀 24. Materialized Performance Layer [❌]

*   **Instant Dashboards:** ใช้ **Materialized Views** สำหรับการคำนวณรายงานที่ซับซ้อนและมีข้อมูลมหาศาล เพื่อให้หน้า Dashboard ของผู้บริหารโหลดได้ทันทีโดยไม่ต้องรอคำนวณสดทุกครั้ง

## 🎨 25. Multi-Tenant Custom Branding Schema [❌]

*   **White-Label Support:** เก็บค่ากำหนดทางด้าน UI (CSS variables, Theme, Logos) ไว้ในระดับ Database เพื่อให้ระบบสามารถปรับเปลี่ยนหน้าตาตามแบรนด์ของแต่ละสาขาหรือแต่ละบริษัท (Tenant) ได้อย่างอิสระ

---

### ⚠️ สิ่งที่ต้องระวัง (Risk Mitigation)
เนื่องจาก `database.types.ts` เดิมมีความยาวเกือบ 5,000 บรรทัด การขยับทีเดียวอาจทำให้ระบบล่มได้ ผมจึงยืนยันตามแผนในข้อ **6.2 (The View Pattern Migration)**:
1.  **Phase 1:** สร้างตาราง V2 ควบคู่ไปกับตารางเดิม
2.  **Phase 2:** สร้าง **Database View** ที่มีชื่อเหมือนตารางเดิม เพื่อให้ Code เก่า 5,000 บรรทัดนั้นยังคงอ่านข้อมูลได้ปกติ (Zero-downtime)
3.  **Phase 3:** ทยอยเปลี่ยน Logic ใน App ให้มาเขียนที่ตาราง V2 โดยตรง

---
**บทสรุป:** พิมพ์เขียวฉบับนี้คือการ **"รื้อเพื่อสร้างใหม่ให้แข็งแรงกว่าเดิม"** โดยไม่มีการทิ้งฟีเจอร์หรือข้อมูลสำคัญใดๆ แม้แต่บรรทัดเดียวครับ!