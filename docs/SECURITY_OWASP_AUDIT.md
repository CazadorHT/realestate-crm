# สรุปการตรวจสอบความปลอดภัย (OWASP Top Ten) — realestate-crm

**สรุป:** เอกสารนี้แม็ปความเสี่ยงจาก OWASP Top Ten (2021) ไปที่โค้ดโปรเจคของเรา และเสนอรายการแก้ไขเชิงปฏิบัติ (short-term / mid-term / long-term) ที่ช่วยลดความเสี่ยงอย่างเป็นระบบ ✅

---

## 🔎 ภาพรวมสั้น ๆ
- สถานะปัจจุบัน: มีการตรวจสอบ auth บางจุด (เช่น การเรียก `supabase.auth.getUser()` ใน server actions) แต่ยังขาด **authorization / ownership checks**, **server-side validation** ก่อนเขียน DB, **image path/storage verification**, **RLS**, **rate-limiting**, และ **audit logging**.
- ผลกระทบหลัก: Broken Access Control, Missing Server-side Validation, Incomplete File/Storage Checks → อาจนำไปสู่การแก้ไข/ลบข้อมูลโดยไม่ได้รับอนุญาต, เกิดข้อมูลไม่สอดคล้อง, หรือถูกโจมตีโดย bot/abuse.

---

## รายการตาม OWASP Top Ten (การค้นพบ + คำแนะนำ)

> แต่ละหัวข้อระบุ: ความเสี่ยง (Severity) → ปัญหาที่พบใน repo → ข้อเสนอ (Actionable fix)

### A01 — Broken Access Control (High)
- ปัญหา: `updatePropertyAction`, `deletePropertyAction` ไม่ได้เช็กว่า user เป็นเจ้าของทรัพย์หรือมีสิทธิ์พิเศษ (admin)
- ข้อเสนอ:
  - Server-side: ก่อน update/delete ให้ตรวจ `created_by === user.id` หรือ role admin
  - DB-side: ตั้ง **RLS policy** ใน Supabase เพื่อบังคับระดับ access
  - ตัวอย่าง SQL policy (Supabase):

```sql
-- ตัวอย่าง policy: ให้แก้ไข/ลบได้เฉพาะผู้สร้างหรือผู้มีบทบาท admin
CREATE POLICY "users_can_modify_own_properties"
  ON public.properties
  FOR ALL
  USING (auth.role() = 'authenticated' AND (created_by = auth.uid() OR auth.role() = 'admin'));
```

### A02 — Cryptographic Failures (Medium)
- ปัญหา: secrets/env management ยังไม่ครบ (แนะนำตรวจเพิ่มเติม)
- ข้อเสนอ: ใช้ Signed URLs เมื่อจำเป็น, เก็บค่า env ใน secret manager, หลีกเลี่ยง public buckets ถ้าไม่จำเป็น

### A03 — Injection (Medium)
- ปัญหา: Supabase client ช่วยกัน SQLi แต่เราไม่มี server-side schema validation ก่อนส่งค่าไป DB
- ข้อเสนอ: เรียก `FormSchema.safeParse(values)` ใน server actions (`createPropertyAction`, `updatePropertyAction`) และ reject ถ้า invalid

### A04 — Insecure Design (Medium)
- ข้อเสนอ: เพิ่ม rate-limiting, captcha สำหรับ public forms, และออกแบบ flows ให้รองรับ rollback/atomic

### A05 — Security Misconfiguration (High)
- ปัญหา: ยังไม่มี middleware สำหรับ security headers / CSP และอาจยังไม่มี RLS
- ข้อเสนอ: เพิ่ม security headers (Next.js middleware) และตรวจนโยบาย RLS ใน DB

### A06 — Vulnerable & Outdated Components (Medium)
- ข้อเสนอ: เปิด `npm audit` ใน CI, เปิด Dependabot, กำหนด policy สำหรับ dependency updates

### A07 — Identification & Authentication Failures (High)
- ปัญหา: บาง action เช่น `uploadPropertyImageAction` ควรเช็ก `user` ก่อนอนุญาต upload
- ข้อเสนอ: ตรวจ `supabase.auth.getUser()` ก่อน upload และเพิ่ม rate-limiter per-user

### A08 — Software & Data Integrity Failures (Medium)
- ข้อเสนอ: ใช้ signed releases / pin critical packages ถ้าเป็นไปได้

### A09 — Security Logging & Monitoring Failures (Medium)
- ปัญหา: ขาด audit logging และ error monitoring integration
- ข้อเสนอ: เพิ่ม Sentry / Logflare integration + log user id + action + timestamp สำหรับ CRUD operations

### A10 — SSRF (Low)
- ข้อเสนอ: ถ้ามี server ที่ fetch external URLs ให้ allowlist hosts และตรวจ validate URL

---

## ✅ Immediate Action Plan (High Priority) — ผมสามารถลงมือทำให้ทันที
ต่อไปนี้เป็นชุดการแก้ไขเร่งด่วน (Highest impact, Low-to-moderate effort):

1) **Server-side validation (FormSchema.safeParse)**
   - Where: `features/properties/actions.ts` ใน `createPropertyAction` และ `updatePropertyAction`
   - What: ใช้ `FormSchema.safeParse(values)` แล้ว return friendly error if invalid
   - Example:
```ts
const parsed = FormSchema.safeParse(values);
if (!parsed.success) {
  return { success: false, message: 'Validation failed', errors: parsed.error.format() };
}
const safeValues = parsed.data;
```

2) **Ownership/Authorization checks**
   - Where: `updatePropertyAction`, `deletePropertyAction`
   - What: ตรวจว่า `created_by === user.id` หรือ user.role === 'admin' ก่อนอนุญาต
   - If fail → return { success:false, message: 'Forbidden' }

3) **Image path validation & existence check**
   - Where: `createPropertyAction` / `updatePropertyAction` ก่อน insert to `property_images`
   - What:
     - Validate each `storage_path` starts with `properties/`
     - Optionally call `supabase.storage.from(bucket).download(path)` or `.list()` to ensure file exists
     - If any missing → reject or remove missing items and log

4) **Rollback on partial failures**
   - If property insert succeeds but images insert fails → delete created property (or use transaction if DB supports)
   - This prevents orphaned/half-created data

5) **Require auth on image upload + Rate limiting**
   - Where: `uploadPropertyImageAction` (server)
   - What: ensure user exists and add basic per-user rate limiting (simple counter in Redis/Upstash or in-memory protected by IP)

6) **Audit logging**
   - Log user id, action, target id, timestamp for create/update/delete requests
   - Integrate with Sentry or a logging sink

---

## Medium-term & Long-term improvements
- Add RLS policies in Supabase for `properties` and `property_images` (see example above)
- Add security headers (CSP, X-Frame-Options) via Next.js middleware
- Add CI checks: `npm audit`, test suite, Dependabot
- Add proper rate-limiter middleware and CAPTCHA for public forms
- Periodic cleanup job for orphaned files

---

## Checklist (Actionable) 🧾
- [ ] Add `FormSchema.safeParse()` calls in server actions (create/update) — **HIGH**
- [ ] Add ownership checks in update/delete — **HIGH**
- [ ] Validate `images[]` paths and check storage existence — **HIGH**
- [ ] Implement rollback on partial failures — **HIGH**
- [ ] Auth + rate-limit for uploads — **HIGH**
- [ ] Add audit logging & integrate Sentry — **MEDIUM**
- [ ] Add RLS policies on DB — **MEDIUM**
- [ ] Add security headers & CSP — **MEDIUM**
- [ ] Add CI `npm audit` + Dependabot — **LOW**

---

## ตัวอย่างโค้ด (สำคัญ) — Rollback pattern
```ts
// Pseudocode inside createPropertyAction
const { data: property, error } = await supabase.from('properties').insert({...}).select().single();
if (error) return { success:false, message: error.message };
try {
  const { error: imagesError } = await supabase.from('property_images').insert(imageRows);
  if (imagesError) throw imagesError;
} catch (e) {
  // rollback
  await supabase.from('properties').delete().eq('id', property.id);
  console.error('Images insert failed, rollback performed', e);
  return { success:false, message: 'Failed to attach images' };
}
```

---

## ขั้นตอนถัดไป (คุณเลือกได้)
- **A** (ผมแนะนำ): ผม implement immediate fixes (server validation, ownership checks, image verification, rollback, upload auth/rate-limit) และรัน type checks. (เริ่มทำได้ทันที)
- **B**: ผมสร้าง SQL RLS policy drafts + PR ให้คุณ review before applying to DB
- **C**: ผมตั้งค่า Sentry + CI audit pipeline

โปรดตอบ: "ทำ A" หรือ "แสดง patch ก่อน" หรือเลือก B/C

---

**ไฟล์นี้ถูกสร้างโดยอัตโนมัติจากการสแกนโค้ด (tools) และควรทบทวนร่วมกับทีมเพื่ออนุมัติการเปลี่ยนแปลงที่ส่งผลถึง DB/production.**

---

_File path: `docs/SECURITY_OWASP_AUDIT.md`_
