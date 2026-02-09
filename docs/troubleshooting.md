# คู่มือการแก้ไขปัญหาเบื้องต้น (Troubleshooting Guide)

คู่มือนี้รวบรวมวิธีแก้ไขปัญหาที่พบบ่อยในการพัฒนาโปรเจกต์ Next.js โดยเฉพาะเมื่อใช้งานร่วมกับ Turbopack

---

## 1. ปัญหา "Unable to acquire lock" หรือ Server ค้าง

ปัญหานี้มักเกิดจากมีกระบวนการ Node.js ค้างอยู่ใน Background หรือไฟล์ตัวช่วยรัน (Lock file) ไม่ถูกลบออกจากการปิดโปรแกรมไม่สมบูรณ์

### วิธีแก้ไข (PowerShell):

1. **ปิด Process ที่ค้างอยู่ทั้งหมด**:
   ```powershell
   taskkill /F /IM node.exe
   ```
2. **ลบแคชและไฟล์ Lock ในโฟลเดอร์ .next**:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3. **เริ่มระบบใหม่**:
   ```powershell
   npm run dev
   ```

---

## 2. การเคลียร์แคชต่างๆ (Cache Clearing)

### การเคลียร์แคชของ Next.js / Turbopack

หากพบว่าหน้าจอแสดงผลไม่ตรงกับ Code ที่แก้ไข หรือมี Error แปลกๆ ที่หาจุดแก้ไม่เจอ ให้ลบโฟลเดอร์ `.next`:

```powershell
Remove-Item -Recurse -Force .next
```

> **หมายเหตุ**: การลบโฟลเดอร์นี้จะทำให้การรันครั้งแรกช้าลงเล็กน้อย เพราะระบบต้องสร้างไฟล์แคชใหม่ทั้งหมด

### การเคลียร์แคชของ Dependencies (node_modules)

หากมีปัญหาเรื่องการติดตั้ง Library หรือ Error เกี่ยวกับ Package:

1. ลบ `node_modules` และ `package-lock.json`:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   ```
2. ติดตั้งใหม่:
   ```powershell
   npm install
   ```

### การเคลียร์แคชของ Client (Browser Cache)

ในบางกรณีปัญหาอาจเกิดจาก Browser เก็บแคชของหน้าเว็บไว้:

- กด `Ctrl + F5` เพื่อ Hard Reload
- หรือเปิดหน้าเว็บในโหมด **Incognito / Private Window** เพื่อทดสอบ

---

## 3. สิ่งที่ควรระวัง (Important Considerations)

- **มาตรฐานไฟล์ Middleware**: โปรเจกต์นี้ใช้ Next.js 16 ซึ่งเปลี่ยนมาตรฐานจาก `middleware.ts` เป็น `proxy.ts` (และฟังก์ชันภายในต้องชื่อ `proxy`) หากคุณเปลี่ยนชื่อไฟล์เป็น `middleware.ts` ระบบอาจะค้างหรือแจ้ง Error ได้
- **การตั้งค่า Module Type**: ใน `package.json` ต้องมี `"type": "module"` อยู่เสมอ เพื่อให้ Next.js จัดการไฟล์ TypeScript ขนาดใหญ่ในโปรเจกต์ได้เร็วขึ้น หากนำออกระบบจะเริ่มช้าลงอย่างเห็นได้ชัด
- **ไฟล์สิ่งแวดล้อม (.env)**: ตรวจสอบให้มั่นใจว่าค่าใน `.env` และ `.env.local` ตรงกันและเป็นปัจจุบัน หากมีการแก้ไขค่าเกี่ยวกับฐานข้อมูล ควร Restart Server (Kill Node) ทุกครั้งเพื่อให้ค่าใหม่มีผล
- **การใช้ Server vs Client Component**: พยายามใช้ Server Components ให้มากที่สุดสำหรับส่วนที่ดึงข้อมูล (Data Fetching) และใช้ Client Components (`"use client"`) เฉพาะส่วนที่มี Interactive เท่านั้น เพื่อลดขนาด JavaScript ที่ต้องส่งไปที่ Browser

---

## 4. เทคนิคการเพิ่มความเร็วเว็บ (Performance Tips)

### การพัฒนา (Development Speed)

- **ใช้ Turbopack**: รันด้วย `npm run dev` (ซึ่งมีแฟล็ก `--turbo`) จะทำให้การเปลี่ยนหน้าและการ Compile เร็วกว่า Webpack แบบเดิมมาก
- **Package Imports Optimization**: ในไฟล์ `next.config.ts` มีการตั้งค่า `optimizePackageImports` เพื่อให้เลือกโหลดเฉพาะส่วนที่จำเป็นของ Library ใหญ่ๆ (เช่น Lucide Icons, UI Components)

### การใช้งานจริง (Production Performance)

- **Image Optimization**: ใช้คอมโพเนนต์ `<Image />` จาก `next/image` เสมอ เพื่อให้ระบบช่วยย่อขนาดภาพและทำ Lazy Loading ให้อัตโนมัติ
- **Database Query**: หลีกเลี่ยงการดึงข้อมูลแบบ Loop (N+1 Problem) ในไฟล์ `queries.ts` ให้พยายามดึงข้อมูลที่จำเป็นมาในครั้งเดียวโดยใช้ `.select()` ที่ระบุฟิลด์ชัดเจน
- **NoStore สำหรับข้อมูลสด**: ใช้ `noStore()` ในฟังก์ชันที่ต้องการข้อมูลที่อัปเดตตลอดเวลา เพื่อป้องกันไม่ให้ Next.js เก็บแคชหน้าที่เป็นข้อมูลเก่าไว้

---

## 5. สาเหตุที่พบบ่อย (Root Causes)

- **Zombie Processes**: การปิด Terminal โดยไม่เลิกคำสั่ง (Ctrl+C) บางครั้งทำให้ Node.js ยังรันค้างอยู่
- **Corrupted Cache**: การบันทึกไฟล์หรือปิดโปรแกรมขณะที่ Turbopack กำลังเขียนไฟล์แคช อาจทำให้แคชเสียหาย
- **Port Conflict**: มี Server รันซ้อนกันหลายพอร์ต ทำให้ระบบสับสนเรื่อง Session หรือ Lock file

---
