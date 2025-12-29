# App Directory Structure

โครงสร้างโฟลเดอร์ใน `app/` ได้รับการจัดระเบียบดังนี้:

## Route Groups

### 📂 `(public)/` - หน้าสาธารณะ

เข้าถึงได้โดยไม่ต้อง Login

**หน้าที่มี:**

- `/` - Landing page (หน้าแรกของเว็บ)
- `/properties` - รายการทรัพย์สินทั้งหมด (Coming soon)
- `/properties/[id]` - รายละเอียดทรัพย์ (Coming soon)

**Layout:** `(public)/layout.tsx` - Layout สำหรับหน้า Public

---

### 📂 `(protected)/protected/` - หน้า CRM ภายใน

ต้อง Login และมีสิทธิ์เข้าถึง (Agent/Admin)

**หน้าที่มี:**

- `/protected` - Dashboard
- `/protected/properties` - จัดการทรัพย์สิน (CRM)
- `/protected/leads` - จัดการ Leads
- `/protected/deals` - จัดการ Deals
- `/protected/owners` - จัดการเจ้าของทรัพย์
- `/protected/profile` - โปรไฟล์ส่วนตัว
- `/protected/settings` - การตั้งค่า

**Layout:** `(protected)/protected/layout.tsx` - Layout พร้อม Sidebar Navigation

---

### 📂 `auth/` - หน้า Authentication

- `/auth/login` - เข้าสู่ระบบ
- `/auth/sign-up` - สมัครสมาชิก
- `/auth/forgot-password` - ลืมรหัสผ่าน

---

### 📂 `api/` - API Routes

- `/api/deals` - Deal management API
- `/api/leads` - Lead management API
- `/api/rental-contracts/[dealId]` - Contract CRUD API

---

## การทำงานของ Route Groups

Route Groups ใน Next.js (โฟลเดอร์ที่ชื่อมีวงเล็บ) จะ:

- ✅ จัดกลุ่ม routes โดยไม่สร้าง URL segment
- ✅ แชร์ layout เฉพาะกลุ่ม
- ✅ แยก public/protected logic ได้ชัดเจน

**ตัวอย่าง:**

- File: `app/(public)/page.tsx` → URL: `/`
- File: `app/(public)/properties/page.tsx` → URL: `/properties`
- File: `app/(protected)/protected/leads/page.tsx` → URL: `/protected/leads`
