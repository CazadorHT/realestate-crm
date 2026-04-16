# Elite Architecture: ระบบจัดการฐานข้อมูลแบบ Dynamic RPC

คู่มือนี้อธิบายวิธีการดูแลรักษาและพัฒนาต่อยอดระบบอัปเดตข้อมูลทรัพย์สิน (Property Update) ในระบบ Real Estate CRM ซึ่งถูกออกแบบมาให้เป็น **Schema-Agnostic (ไม่ยึดติดกับโครงสร้างตาราง)**, **Atomic (ทำงานเป็นหนึ่งเดียว)**, และ **Secure (ปลอดภัยสูง)**

---

## 🏗️ ภาพรวมโครงสร้างระบบ (Architecture Overview)

### ข้อดีหลักของระบบนี้:
- **Atomicity:** การแก้ไขทั้งหมด (ข้อมูลทรัพย์สิน + ตารางความสัมพันธ์อื่นๆ) จะสำเร็จหรือล้มเหลวไปพร้อมๆ กัน ป้องกันข้อมูลค้างหรือผิดพลาด
- **Dynamic Mapping:** ฐานข้อมูลจะทำการจับคู่ (Map) คีย์ใน JSON กับชื่อคอลัมน์ในตารางให้เองโดยอัตโนมัติ
- **Strict Security:** มีขอบเขตความปลอดภัยที่เข้มงวด เฉพาะคอลัมน์ที่ได้รับอนุญาต (Whitelist) เท่านั้นที่จะถูกอัปเดตได้
- **Optimistic Locking:** ป้องกันปัญหา "การเขียนทับข้อมูล" (Lost Updates) เมื่อมีผู้ใช้สองคนแก้ไขทรัพย์สินชิ้นเดียวกันในเวลาใกล้เคียงกัน

ระบบนี้ใช้รูปแบบ **Single-Transaction RPC (Remote Procedure Call)** แทนที่การส่งคำสั่ง SQL หลายๆ ครั้งจาก Client เราจะส่งข้อมูลทั้งหมดเป็นก้อน JSON เพียงก้อนเดียวไปยังฟังก์ชันพิเศษใน PostgreSQL ชื่อว่า `update_property_elite` เพื่อให้มั่นใจว่าข้อมูลทุกส่วน (ข้อมูลหลัก + รูปภาพ + เอเจนท์) จะถูกบันทึกสำเร็จพร้อมกันทั้งหมด

---

## 🚀 แนวทางการแก้ไขเมื่อ Requirement เปลี่ยนแปลง (Future-Proofing)

เพื่อให้การทำงานในอนาคตเป็นไปอย่างราบรื่น ผมสรุปเคสตัวอย่างและการรับมือมาให้ดังนี้ครับ:

### 🌟 1. การเพิ่มฟิลด์ใหม่ (Add New Field)
**สถานการณ์:** ต้องการเพิ่มคอลัมน์ `energy_rating` (เกณฑ์ประหยัดพลังงาน) เก็บเป็นตัวอักษร

*   **ขั้นตอนที่ 1: Database Schema** 
    ```sql
    ALTER TABLE properties ADD COLUMN energy_rating TEXT;
    ```
*   **ขั้นตอนที่ 2: TypeScript (`update.ts`)**
    ```typescript
    const p_data = {
      ...propertyFields,
      energy_rating: values.energyRating // ใส่ค่าเข้าก้อน JSON ได้เลย
    };
    ```
*   **ผลลัพธ์:** ระบบจะทำการ Update ฟิลด์นี้ให้เองอัตโนมัติโดยที่ **"ไม่ต้องแตะต้องโค้ด SQL RPC"** แม้แต่บรรทัดเดียว เพราะระบบมี Dynamic Whitelisting ตรวจจับคอลัมน์ใหม่ให้เอง

### 🔄 2. การแก้ชื่อคีย์หรือการแปลงข้อมูล (Data Mapping)
**สถานการณ์:** หน้าบ้านส่งค่า `gps_location` มาเป็นวัตถุ แต่ในฐานข้อมูลแยกเก็บเป็นคอลัมน์ `lat` และ `lng`

*   **TypeScript Layer (`update.ts`):** ประมวลผลก่อนเข้า RPC
    ```typescript
    const p_data = {
      ...otherFields,
      lat: values.gps_location.lat,
      lng: values.gps_location.lng
    };
    ```

### 🔗 3. การเพิ่มตารางความสัมพันธ์ใหม่ (New Junction Table)
**สถานการณ์:** ต้องการเพิ่มระบบ **"Tags"** (เช่น 'บ้านเดี่ยว', 'ใกล้รถไฟฟ้า') โดยมีตารางสัมพันธ์คือ `property_tags`

*   **ขั้นตอนที่ 1: SQL RPC (`update_property_elite.sql`)** เพิ่ม Logic หนึ่งครั้ง:
    ```sql
    -- เพิ่มภายในตัวฟังก์ชัน update_property_elite
    IF p_data ? 'tag_ids' THEN
        DELETE FROM public.property_tags WHERE property_id = p_id;
        INSERT INTO public.property_tags (property_id, tag_id)
        SELECT p_id, (t_id)::UUID 
        FROM jsonb_array_elements_text(p_data->'tag_ids') AS t_id;
    END IF;
    ```
*   **ขั้นตอนที่ 2: TypeScript (`update.ts`)**
    ```typescript
    const p_data = {
      ...fields,
      tag_ids: values.tags // ส่งเป็น Array ของ UUID
    };
    ```

---

## 🛡️ ฟีเจอร์ด้านความปลอดภัย (Security)

### คอลัมน์ที่ได้รับความคุ้มครอง (Protected Columns)
ระบบมี **Internal Blacklist** ป้องกันการแก้ไขคอลัมน์สำคัญผ่านระบบ Dynamic:
- `id`, `tenant_id`, `version`, `created_at`, `created_by`, `owner_id`, `updated_at`

### การตรวจสอบสิทธิ์แบบฝังตัว (Deep Security check)
ฟังก์ชันถูกกำหนดเป็น `SECURITY DEFINER` และมีการ Check สิทธิ์ความเป็นเจ้าของในระดับ Transaction ทุกครั้ง เพื่อให้มั่นใจว่าจะมีเพียงผู้ที่ได้รับอนุญาตเท่านั้นที่จะแก้ไขข้อมูลได้

---

## 🔍 การตรวจสอบข้อผิดพลาด (Debugging Case Study)

| Error Code | สาเหตุที่พบบ่อย | วิธีแก้ไข |
| :--- | :--- | :--- |
| **VC409** | มีการแก้ไขข้อมูลทรัพย์สินเดียวกันพร้อมกัน | แจ้งเตือนผู้ใช้ว่าข้อมูลมีการเปลี่ยนแปลง และให้โหลดข้อมูลใหม่ (Re-fetch) |
| **VC403** | ผู้ใช้ไม่มีสิทธิ์เข้าถึงหรือแก้ไขทรัพย์สินของผู้อื่น | ตรวจสอบ Permission/Role ของผู้ใช้ |
| **TypeError** | ข้อมูลที่ส่งมาใน JSON มีประเภทไม่ตรงกับคอลัมน์ใน DB | ตรวจสอบการแปลงประเภทข้อมูล (Type Casting) ใน TypeScript ก่อนส่ง |

---

## 💡 สรุปหลักการทำงานจริง (The Golden Rule)

*   **งานส่วนใหญ่ (90%):** คุณจะแก้ไขแค่ใน **TypeScript (`update.ts`)** และ **Database Schema** (เพิ่มคอลัมน์)
*   **งานส่วนน้อย (10%):** จะกลับมาแก้ไข **SQL RPC** เฉพาะกรณีพิ่มตารางความสัมพันธ์ใหม่ๆ เท่านั้น

**TIP**
* สิ่งที่ต้องทำต่อ: หากมีการเพิ่มฟิลด์ในตาราง properties ในอนาคต อย่าลืมมาอัปเดต Mapping ใน diff.ts
* เพื่อให้การดักจับประวัติสมบูรณ์เสมอครับ