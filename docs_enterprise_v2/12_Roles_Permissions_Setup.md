# 🔑 12: การตั้งค่าสิทธิ์และการหุ้ม Proxy (Roles & Permissions Setup)

> **กลไกแกนกลาง:** Middleware, ES6 Proxy Objects, Supabase Auth
> **อัปเดตล่าสุด:** 22 สิงหาคม 2026 (Enterprise v4.0 - August 2026 Release)
> **หลักการ:** Zero-Mistake Authorization - สิทธิ์ต้องทำงานโดยที่ทีมพัฒนาไม่ต้องใช้ความจำ

ต่อเนื่องจากทฤษฎีในเอกสาร 05 นี่คือการด่ำดิ่งสู่ "โค้ดจริง (Implementation)" ว่าระบบจัดการสิทธิ์ระดับ Enterprise ของเราหุ้มปราการล็อกไว้ได้อย่างไรโดยที่หน้าบ้านแทบจะไม่รู้สึกตัว

---

## 1. Zero-Any และ The Proxy Injector (ศิลปะมนตร์ดำ)

การอาศัยความเป็นมืออาชีพของ Dev เขียน `.eq('tenant_id', ...)` ใน 500 API Endpoints คือหายนะที่รอวันเกิด (Ticking Time Bomb) หากมีโค้ดใหม่หลุดการรีวิวและไม่ได้ใส่ eq ข้อมูลบริษัทอื่นระดับหลักร้อยล้านจะหลุดออกสู่ภายนอกทันที

### 1.1 การสร้างกำแพงล่องหน (The Invisible Proxy Wall)
เราเขียนฟังก์ชันสกัดกั้นการเชื่อมต่อ (Repository Scoped Client)
- ทุกครั้งที่ `getServerAction()` หรือ `fetchData` ถูกเรียก มันไม่ได้เชื่อมต่อตรงไปหา Supabase 
- มันถูกผูกผ่าน ES6 `Proxy` Object ที่ส่องสแกนดูว่า Dev กำลังพิมพ์คำสั่งตระกูล CRUD (Select, Update, Insert, Delete) หรือไม่
- หากตรวจพบ Proxy จะขโมยคำสั่งเหล่านั้นมายัดไส้ `tenant_id = User.branch_id` ลงไปใน Payload เงียบๆ 

**ความหมายก็คือ:** ซอร์สโค้ดหน้าบ้านดูโง่และคลีนมากๆ `getDeals()` แต่ตอนที่คิวรีวิ่งเข้าถึง Database มันพกระเบิดที่ล็อกสาขาเอาไว้แน่นหนา ทำให้โปรแกรมเมอร์ที่ทำงานโปรเจคนี้สบายหัวขึ้น 100%

---

## 2. Server-side Session & JWT Injection

การตรวจสอบสิทธิ์ใน Next.js มักจะเจอการขโมย Token ฝั่ง Client หากทำไม่เป็น

### 2.1 บีบอัดอำนาจไว้ใน App Metadata (Supabase Auth Edge)
- แทนที่เราจะรัน Database query `select role from users` ทุกครั้งที่โหลดหน้าเว็บ ซึ่งทำให้ฐานข้อมูลเหนื่อยล้า 
- เราฝัง Custom Claim ไว้ใน JWT ของผู้ใช้ตั้งแต่จังหวะที่ล็อกอินเสร็จ (`Role: BRANCH_MANAGER`, `Tenant: 001`) 
- เวลาที่ Middleware ของหน้าเว็บทำงาน มันแค่แกะซองจดหมาย JWT ดู ถ้าบทบาทไม่ใช่ผู้บริหาร ก็จะปัดตกกลับหน้า Login (HTTP 401) ป้องกันการข้ามหน้าต่างโดยไม่กระทบฐานข้อมูลหลักเลยแม้แต่นิดเดียว!

---

## 3. สภาพแวดล้อมที่รองรับ Human-in-the-Loop 

ฟีเจอร์ AI Marketing มักจะสร้างคอนเทนต์หลุดโลก 
- สิทธิ์ **"AI Sentinel"** ถูกสร้างขึ้นเพื่อแอดมินหัวหน้าทีม
- เอเยนต์ธรรมดาเจนรูปและบทความผ่าน AI ได้ แต่สถานะตารางจะถูกรั้งไว้ที่ "DRAFT_PENDING_REVIEW" 
- ผู้ถือ Role: Sentinel จะเห็นหน้า Dashboard แยกเฉพาะเพื่ออนุมัติ "ปุ่ม Approve" ระบบค่อยปั๊มผลลัพธ์นั้นส่งขึ้น Facebook ผ่าน Inngest Queue

---

## 4. การควบคุมสิทธิ์ฟีเจอร์ v4.0 (Social Studio & Popular Area Access)

- **Social Studio Access**: สิทธิ์การสร้างการ์ดสื่อโฆษณาโซเชียลเปิดให้ `AGENT`, `MANAGER`, `OWNER`, และ `ADMIN` สามารถใช้งานได้เฉพาะกับทรัพย์สินที่ได้รับสิทธิ์ตาม RLS สังกัดตนเอง
- **Popular Area Admin Control**: สิทธิ์การเพิ่ม/ลบ/แก้ไขตาราง `popular_areas` และพิกัดทำเลทอง ถูกจำกัดให้เฉพาะ `ADMIN (SuperAdmin)` ผ่านการตรวจสอบ `is_system_admin()` บน Server Actions และ Database RLS Policies เท่านั้น

---

_เอกสารระบบสิทธิ์การเข้าถึงปรับปรุงล่าสุดตามมาตรฐาน Enterprise v4.0_
