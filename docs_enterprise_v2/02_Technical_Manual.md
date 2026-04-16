# 🛠️ 02: คู่มือเทคนิคัลเจาะลึก (Enterprise Technical Manual)

> **เทคโนโลยีแกนกลาง:** Next.js 16 (App Router), Turbopack, Tailwind CSS 4, React Query, Supabase SSR
> **ระดับความเข้มข้น:** สถาปนิกระบบ (Systems Architecture)

เอกสารฉบับนี้เจาะลึกถึงก้นบึ้งของเทคนิคการประกอบโมดูล (Composability) และสถาปัตยกรรมระดับโค้ดของแอปพลิเคชัน ที่ช่วยทำลายเส้นจำกัด (Bottleneck) ที่ระบบ Frontend และ Backend มักจะเผชิญเมื่อมีการสเกล

---

## 1. Next.js 16.1.6 App Router & Hydration Strategy

ระบบนี้หลีกเลี่ยงข้อผิดพลาดร้ายแรงของระบบ Enterprise สมัยใหม่ นั่นคือ "การแคชจนข้อมูลปลอมหลอกตาผู้ใช้งาน" (Stale Data Presentation)

### 1.1 Pessimistic Revalidation & Server Actions
แอปพลิเคชันใช้งาน React Server Actions อย่างหนาแน่น เพื่อความปลอดภัย (เนื่องจากโค้ดไม่หลุดสู่ Client) แต่อุปสรรคคือการสั่งให้จออัปเดต โดยได้มีการวาง **State Management Strategy** ที่ชัดเจน:
- **`revalidatePath` / `revalidateTag`**: ทันทีที่มีการเรียก `updateDeal` หรือ `deleteProperty` ฟังก์ชันหลักจะเชิดคำสั่งข้ามกลับมาเซิร์ฟเวอร์ และทำการล้างแคชทิ้งอย่างดุดัน ทำให้การกดกลับไปหน้าตาราง จะได้ข้อมูลหน้าใหม่ 100% เสมอ
- **Client Fallback**: เพื่อไม่ให้ UI ดับ หรือกระตุกขณะรอแคชหน้าบ้าน มีการฝังระเบียบของ Optimistic UI ควบคู่กับ React Query (ในจุดที่มีตัวกรองตารางซับซ้อน) โดยตั้งเวลาทำ Stale-time ให้อยู่ระดับต่ำ เพื่อให้ Fetch ใหม่อัตโนมัติเมื่อ User โฟกัสกลับมาที่เบราว์เซอร์

### 1.2 โค้ดสปลิตติ้งและ Lazy Loading ลดภาระ Bundle (The UX Enhancer)
ระบบ B2B ที่อัดแน่นทั้ง TipTap (Rich Text), Recharts, และ Google Maps มักกระตุกหน้าจอแตกในมือถือแอนดรอยด์ราคาถูก 
- โค้ดเบสจึงใช้เทคนิค `next/dynamic` โหลดไลบรารีหนักๆ "เฉพาะเมื่อ User สไลด์หรือคลิกถึง Step ฟอร์มนั้น" (Lazy loaded by conditional trees) ทำให้ Initial Page Load เร็วปานกามนิต

---

## 2. 🧙‍♂️ มนตร์ดำแห่ง Type-Safety: "The Proxy Injector"

นี่คือความลับอันดับหนึ่งของการวาง **Enterprise Tenant Isolation** อย่างหมดจด โดยไม่ต้องพึ่งนักพัฒนาให้มีสติเตือนตัวเองในทุกบรรทัด

### 2.1 ปัญหาของโลกความจริง
ซอฟต์แวร์ที่ใช้ร่วมกันหลายบริษัท (Multi-Tenant) มักจะมีบั๊กที่โปรแกรมเมอร์เผลอลืมพิมพ์ `.eq('tenant_id', ...)` ส่งผลให้สาขาลาดพร้าว ดันเสิร์ชเจอทรัพย์ของสาขาสุขุมวิท

### 2.2 การสร้าง Runtime Proxy Interception
โปรเจคนี้มีการสร้าง **Object Proxy (ES6 Proxy)** เพื่อครอบกลไกฐานข้อมูลของ Supabase โดยตรง
```typescript
// สถาปัตยกรรมจำลองการดักจับ
const createScopedClient = (supabaseClient, scopedTenantId) => {
    return new Proxy(supabaseClient, {
        get(target, prop, receiver) {
            // ดักจับการเรียก Table()
            // ผูกโยง .eq('tenant_id', scopedTenantId) เข้าไปในระดับ Runtime โดยที่โปรแกรมเมอร์ไม่มีทาง Bypass ได้
        }
    })
}
```
ผลลัพธ์คือ **Zero-Any Typing Effect** โปรแกรมเมอร์หน้าบ้านแค่รับพิมพ์ `supabase.from('deals').select('*')` โดยไม่ต้องรับผิดชอบเรื่องความรู้ด้านสาขาเลย ระบบ Proxy หุ้มเปราะฐานข้อมูล จะจัดการผูกไอดีพนักงานให้เงียบๆ 

---

## 3. สถาปัตยกรรม Mobile & UI UX (Omnipresent Interfaces)

แอปนี้ไม่ได้หยุดแค่ "เว็บย่อส่วน" ให้พอเปิดในมือถือได้ แต่เป็นการใช้ปรัชญาสัมผัส (Touch-first Mentality):
- **Dialogs vs Drawers (Vaul)**: เปลี่ยนป็อปอัพธรรมดา เป็นลิ้นชักที่ดึงจากข้างล่าง (Bottom Drawer) เมื่อระบบตรวจจับความกว้างจอมือถือ (Responsive Hook) ให้ประสบการณ์เหมือนแอปพลิเคชันพื้นเมือง (Native-like) ทันที
- **Infinite Scroll Matrix**: หน้าจอ Omnichannel Inbox สานรวมกับ Intersection Observer API เมื่อ User เลื่อนสุดแชท จะพ่น History เก่าออกแบบไร้รอยต่อ โดยไม่ซ้อน Layer ทับให้เปลือง RAM

---

## 4. จัดการวิกฤตของโมดูลลึกซึ้ง (Error & Boundaries)

เมื่อย้ายการประมวลผลเข้าสู่ระดับ Background และการใช้ AI อาการ "ท่อตัน (Error Pipe)" มีโอกาสเกิดบ่อยกว่าปกติ 
- **Graceful Error Boundaries**: หาก Chart ระเบิด หรือ AI หายไป จะพังเฉพาะส่วน Component (โชว์ Safe mode สีเหลือง) ในขณะที่หน้าเว็บข้างๆ ยังไหลลื่น สัญญาและฐานข้อมูลจะไม่หยุดทำงานกะทันหัน
- โค้ดทั้งหมดผ่านกระบวนการ Compile ด้วย Turbopack รองรับการรันระดับ 1 ล้านบรรทัด โดยไร้เสียงเตือน Import Resolution Path พลาด เพราะเราแก้ไขระบบ Barrel import export แตกไปแล้วทั้งหมด
