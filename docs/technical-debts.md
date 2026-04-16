# 🚨 วิเคราะห์ระเบิดเวลาและหนี้เทคนิคฉบับขยายความ (Extended Technical Debts & Precautions)

เอกสารฉบับนี้จัดทำขึ้นเพื่อรวบรวม "หนี้เทคนิค (Technical Debts)" และความเสี่ยงที่ซ่อนอยู่ในระบบตามโครงสร้างโค้ดล่าสุด นอกเหนือจากปัญหาเรื่อง Vendor Lock-in หรือสถาปัตยกรรมระดับกว้าง เพื่อให้ทีมพัฒนาและสถาปนิกใช้เป็นแผนที่ในการรับมือปัญหาล่วงหน้าก่อนที่ระบบจะล่มหรือเกิดวิกฤตขยายฐานผู้ใช้

---

# 🚨 เจาะลึกความเสี่ยงและแนวทางแก้ไข (Technical Debt Solutions)

ขยายความจากบทวิเคราะห์โปรเจค (Project Review) ในส่วนของ **"ข้อควรระวังและหนี้เทคนิค"** ที่กำลังเป็น "ระเบิดเวลา" ของโปรเจค Real Estate CRM ตัวนี้ พร้อมทั้งแนวทางการแก้ไข (Action Plan) แบบเป็นรูปธรรม

---

## 1. ⛓️ Vendor Lock-in (ผูกติด Supabase/Vercel มากเกินไป)

**🔴 ปัญหา:**
โค้ดของคุณพึ่งพาฟีเจอร์ระดับลึกของ Supabase อย่างรุนแรง (PostgreSQL RPC, Supabase Trigger, RLS, และ Realtime) ทำให้ถ้าวันหนึ่งธุรกิจเติบโตจนค่าบริการ Supabase แพงทะลุหลังคา หรือลูกค้า Enterprise ระดับองค์กรมหาชนบังคับว่า "ต้องการติดตั้งบน On-Premise หรือ AWS ส่วนตัวเท่านั้น" คุณจะเจอฝันร้ายในการรื้อโค้ดใหม่ทั้งหมด 

**🟢 วิธีแก้ (Action Plan):**
1. **Repository Pattern (ระดับกลาง):** ถึงแม้ตอนนี้จะแก้ไขยากเพราะผูกโค้ดไปเยอะแล้ว แต่ในโมดูลใหม่ๆ ควรเริ่มประยุกต์ใช้ [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html) เพื่อแยกส่วน Business Logic ออกจาก Database Logic ยกตัวอย่างเช่น แทนที่จะเรียก `supabase.from('deals')` ในทุกคอมโพเนนต์ ให้สร้างฟังก์ชันอินเตอร์เฟสคั่นกลาง `DealsRepository.create()` ไว้
2. **Document the "Black Magic":** จดบันทึก SQL Migration (โดยเฉพาะพวก Function Rpc และ Trigger) ทั้งหมดให้อยู่ในรูปแบบโค้ด (Infrastructure as Code) ซึ่งดูเหมือนโปรเจคคุณเริ่มทำบ้างแล้วในรูปแบบ `.sql` ในอนาคตถ้าจะหนีจาก Supabase จริงๆ ก็ยังพอใช้ PostgreSQL เพียวๆ รันสคริปต์เหล่านั้นได้
3. **Containerization:** วางแผนระยะยาวในการเตรียม Dockerfile สำหรับ Next.js App เพื่อให้ไม่ต้องผูกติดตายกับ Vercel Edge Runtime และสามารถ Deploy ไปที่ AWS ECS หรือ Google Cloud Run ได้

---

## 2. 🤯 Steep Learning Curve (ทีมงานใหม่ตายเรียบ)

**🔴 ปัญหา:**
คุณเขียนโค้ดที่ฉลาดมากระดับ "Black Magic" เช่น การทำ Runtime Proxy Injector เพื่อดัก `tenant_id` แบบอัตโนมัติ หรือระบบ Atomic RPC ถือเป็นงานระดับ Senior/Staff Engineer แต่เมื่อต้องขยายทีม สเกลบริษัทย่อมต้องจ้าง Junior/Mid-level Dev เข้ามา ซึ่งคนกลุ่มนี้เมื่อเจอ Proxy ที่เปลี่ยน Type ของข้อมูลตอน Runtime หรือเจอ Bug ที่เกิดจากฐานข้อมูล (ไม่ใช่ฝั่ง Node API) จะหาต้นตอไม่เจอและเสียเวลา On-boarding นานมาก

**🟢 วิธีแก้ (Action Plan):**
1. **Architecture Decision Records (ADRs):** สร้างโฟลเดอร์ `/docs/architecture/` ในโปรเจคเพื่อเขียน Markdown อธิบายว่า "ทำไมถึงเลือกใช้ Proxy?", "ระบบ Atomic Sync ทำงานยังไง?" (Why and How) คอยเป็นคัมภีร์ให้คนใหม่
2. **Fail-Loud in Dev Mode:** ปรับปรุง Proxy Script ให้มีการแสดง Console.log/Warning ตัวใหญ่ๆ ในโหมด Development ว่า *"⚠️ Proxy Intercepted: Injected branch_id"* เพื่อให้ Dev รู้ตัวเสมอว่ามีสิ่งลี้ลับทำงานอยู่เบื้องหลัง
3. **Standardize Onboarding Checklist:** บังคับให้ Dev ใหม่ทุกคนอ่านไฟล์ `db-structure.md` และดูแผนภาพฐานข้อมูลก่อนจับซอร์สโค้ด

---

## 3. 🔌 Real-Time WebSocket Limitations (คอขวดแชทและการแจ้งเตือน)

**🔴 ปัญหา:**
ตราบใดที่เว็บยังมีแค่ผู้ดูแลระบบหลักร้อยคน Supabase Realtime (WebSocket) เอาอยู่สบายๆ แต่เมื่อไหร่ที่คุณปล่อยให้ "ลูกค้า หรือ Owner" เข้ามาใช้แชทบนเว็บหลักหมื่นคน ระบบจะชนเพดาน Concurrent Connections ของแพ็คเกจ Supabase ทันที ซึ่งมีราคาอัปเกรดที่ค่อนข้างสูง

**🟢 วิธีแก้ (Action Plan):**
1. **Graceful Degradation (Polling Fallback):** โค้ดส่วน Frontend ควรตรวจสอบสถานะของ WebSocket หากหลุดหรือเชื่อมต่อไม่ได้เพราะเซิร์ฟเวอร์เต็ม ควรมีระบบ "ตกลงสู่พื้นอย่างนุ่มนวล" โดยเปลี่ยนไปยิง API เช็คข้อมูลใหม่ (Long Polling แบบเบาๆ) ทุก 10 วินาทีแทน เพื่อให้แชทยังใช้งานต่อได้แม้ Realtime ล่ม
2. **Page Visibility API:** ซึ่งคุณมีลอจิกคล้ายๆ กันอยู่บ้างแล้ว ให้บังคับใช้อย่างเข้มข้น หากยูสเซอร์สลับแท็บเบราว์เซอร์ลึกๆ เกิน 2 นาที (ไม่ได้ดูหน้าแชท) ให้บังคับสั่ง `supabase.removeChannel()` ทันทีเพื่อคืนสล็อตให้คนอื่น และต่อใหม่ตอนเปิดแท็บกลับมา
3. **พิจารณาทางเลือกเฉพาะทาง (Long Term):** ถ้าระบบแชทโตเกิน 30% ของโหลดทั้งระบบ ให้แยก Microservice สำหรับแชทออกไปใช้ **Pusher.com** หรือ **Ably** ซึ่งเก่งและราคาเป็นมิตรกว่าในด้าน Concurrent Socket

---

## 4. 🧠 Next.js App Router State & Cache Complexity

**🔴 ปัญหา:**
ระบบ B2B ที่เน้นตารางข้อมูลและ Dashboard ต้องการ Data Freshness (ข้อมูลใหม่เสมอ) แต่ Next.js App Router สร้างมาโดยมีความ "บ้าคลั่งแคช" (Aggressive Caching) เป็นดีฟอลต์ หากผสมผสาน Server Actions กับรหัสของ Client ไม่ดี แอดมินแก้ราคาบ้านไปแล้ว แต่พอกดกลับมาหน้าตาราง ราคายังโชว์ของเก่าอยู่ เพราะ Next.js ยังแคช Server Component ไว้ ส่งผลให้เกิดความสับสนอย่างรุนแรง

**🟢 วิธีแก้ (Action Plan):**
1. **Pessimistic Revalidation:** หลังจากการทำ Server Actions (เช่น อัปเดตผ่าน `updateDeal`) ให้ชัวร์ว่ามีการเรียก `revalidatePath('/protected/deals')` หรือ `revalidateTag()` เสมอ ห้ามพึ่งพา `router.refresh()` ของ Client-side เพียงอย่างเดียว
2. **ใช้ React Query ควบคู่ Server Actions:** หากหน้าไหนต้องมีตัวกรอง (Filter) ซับซ้อนและอัปเดตตลอดเวลา ควรย้ายจาก Server Component ไปใช้ Client Component + React Query (`@tanstack/react-query`) เพราะมีระบบ Cache Invalidation/Stale Time ที่ควบคุมด้วยมือได้ง่ายและนิ่งกว่าในแอปแนว Dashboard

---

## 5. 🌍 Multi-Language (i18n) Database Schema Limits

**🔴 ปัญหา:**
 ปลายทางของการทำเว็บไซต์อสังหาริมทรัพย์ระดับพรีเมียม คือการเจาะตลาดสากล เช่น กลุ่ม expat จีน รัสเซีย ตะวันออกกลาง ปัจจุบัน Database เก็บฟิลด์การแปลเป็นแนวนอน เช่น `title_th`, `title_en`, `title_cn`. หากวันหนึ่งบอสสั่งเพิ่ม "ภาษารัสเซีย" คุณต้องไปทำ `ALTER TABLE` สร้างคอลัมน์ใหม่ใน 4-5 ตารางหลัก รวมถึงแก้ TypeScript Interface ตลอดทั้งแอป ซึ่งเหนื่อยและเสี่ยงพังมาก

**🟢 วิธีแก้ (Action Plan):**
1. **Jsonb Translations Field (Quick Fix):**
   เปลี่ยนการกระจายคอลัมน์เป็นรวมไว้ในฟิลด์ jsonb แทน เช่น สร้างฟิลด์ `translations` (JSONB)
   ```json
   {
      "en": { "title": "Luxury Condo", "description": "Near BTS" },
      "cn": { "title": "豪华公寓", "description": "靠近轻轨" }
   }
   ```
   วิธีนี้ทำให้เมื่อเพิ่มภาษาใหม่ ฐานข้อมูลและ Schema หลักไม่ต้องถูกแตะเลย (ยังสามารถใช้ Index GIN ได้ปกติ)
2. **Translation Table (Enterprise Fix - ระยะยาว):**
   แยกตารางเนื้อหาแบบ 1-to-many 
   เช่น `property_translations` (id, property_id, locale, title, excerpt, content)
   เวลา Query จะใช้ Join (`.eq('property_translations.locale', 'en')`) วิธีนี้สเกลได้ล้านภาษาโดยไม่เป็นอุปสรรคกับตารางหลัก แต่ข้อเสียคือ Query จะซับซ้อนขึ้นนิดหน่อย

## 6. 🗑️ มหันตภัย Cascading Deletes และ Foreign Keys (ข้อมูลประวัติหายวับ)

**🔴 ปัญหา (The Risk):**
ระบบ CRM คือระบบที่ตัวแปรพันกันยุ่งเหยิง เช่น Deal ผูกกับ Agent, Agent ผูกกับ Commission, Commission ผูกกับ Branch. หากผู้ดูแลระบบทำการ "ลบพนักงาน (Agent)" ออกจากระบบด้วยคำสั่ง Hard Delete (ลบทิ้งจากฐานข้อมูลจริงๆ) มันอาจจะส่งผลกระทบต่อเนื่อง (Cascade) ทำให้ประวัติการขาย, ดีล, และบัญชีระบุคนทำหลอมละลายหายไปทั้งแถบ หรือเกิด Error รุนแรงเมื่อเรียกดูประวัติของสาขานั้น

**🟢 วิธีแก้ (Action Plan):**
1. **Global Soft Deletes:** เปลี่ยนการลบทั้งหมดเป็น "Soft Delete" โดยเพิ่มคอลัมน์ `deleted_at` ในทุกตารางที่เป็น Master Data (เช่น `users`, `properties`, `deals`) การทำเช่นนี้ทำให้ข้อมูลยังอยู่ครบถ้วนสำหรับการทำ Audit แต่จะมองไม่เห็นในระดับ Application
2. **Archiving System:** สำหรับข้อมูลสำคัญที่ถูกทิ้ง (เช่น ดีลที่ตายแล้ว หรือผู้ใช้ที่ลาออก) ควรเปลี่ยน `status` เป็น `ARCHIVED` ไว้ก่อน แทนที่จะอนุญาตให้ใครก็ตามมากดปุ่มรูปถังขยะได้อย่างอิสระ
3. **Audit History Backup:** โค้ดปัจจุบันมีการทำ Timeline UI ซึ่งดึงข้อมูลจาก `audit_logs` ถือว่าเป็นการปกป้องที่ดี แต่ต้องมั่นใจว่าไม่มีใครสามารถไป `DELETE FROM audit_logs` ได้ (ควรตั้ง RLS Policy ปิดกั้นการลบทั้งหมด)

---

## 7. 📱 Mobile Offline / Unstable Connection State Handling (ปัญหาหน้างานเน็ตหลุด)

**🔴 ปัญหา (The Risk):**
ตามแผนงาน ระบบนี้จะถูกเอเยนต์ใช้เดินพาดูบ้าน อัปโหลดรูป และแก้ไขสถานะ ซึ่งหน้างานอย่างคอนโดชั้นสูง หรือหมู่บ้านรอบนอก อินเทอร์เน็ตอาจจะไม่เสถียร หากกดยืนยันการ "ปิดดีล" แล้วเน็ตกระตุก ระบบอาจจะเข้าสู่สถานะหมุนค้าง (Loading forever) เอเยนต์อาจจะพยายามกดรัวๆ (ถึงแม้หน้าบ้านมี Rate Limit) แต่ประสบการณ์ใช้งานในสถานการณ์เน็ตหลุดอาจทำให้โกรธจนเลิกใช้ได้เลย

**🟢 วิธีแก้ (Action Plan):**
1. **Service Workers & PWA (Local Caching):** เริ่มแปลงเว็บไซต์ให้เป็น Progressive Web App (PWA) เพื่อเก็บ Cache ข้อมูลพื้นฐานไว้บนเครื่อง เมื่อเน็ตหลุด แอดมินยังสามารถกดอ่านรายละเอียดบ้านได้อย่างลื่นไหล
2. **Offline-First Action Queue (ระดับแอดวานซ์):** เพิ่ม React Query แบบ Persist/Offline Mutation เมื่อแอดมินกดบันทึกหรือเปลี่ยนสถานะขณะเน็ตหลุด ข้อมูลจะถูกดองไว้บน LocalStorage ก่อน และพยายาม Sync ใหม่อัตโนมัติทันทีที่ตรวจพบว่าอินเทอร์เน็ตเชื่อมต่อติด
3. **UI Feedback ชัดเจน:** แจ้งเตือนสีเหลืองด้านบนแอป เช่น "คุณกำลังออฟไลน์ ข้อมูลที่กรอกจะถูกบันทึกเมื่อมีสัญญาณ"

---

## 8. 💸 AI Cost Explosion & Prompt Injection (ความเสี่ยง AI เผางบและโดนแฮก)

**🔴 ปัญหา (The Risk):**
ระบบมีการประยุกต์ใช้ AI ในการร่างคำบรรยาย (Description Generator) และหน้าต่างประเมินราคา (AVM) ถึงแม้เราจะมี `ai_usage_logs` สำหรับเก็บสถิติ แต่ถ้าเกิดเหตุการณ์พนักงานใช้ AI กดเล่นวันละพันรอบ หรือคู่แข่งรู้ว่าเป็นตรรกะ AI ส่ง Prompt ประหลาดมาแกล้งป่วนระบบให้เสียเงิน (Prompt Injection) งบ API ของ OpenAI/Gemini อาจถูกเผาเป็นแสนบาทภายในคืนเดียวได้

**🟢 วิธีแก้ (Action Plan):**
1. **Hard Budget Caps & Kill Switch:** ตั้งโควต้าการใช้งาน AI อัตโนมัติ (เช่น 50 ครั้ง/วัน/บัญชีพนักงาน) ถ้ายอดทะลุ ระบบจะต้อง Disable ปุ่ม AI ของพนักงานคนนั้น และต้องให้ผู้บริหารอนุมัติเพิ่มเท่านั้น (อย่าพึ่งพาแค่ Upstash Rate Limit ที่นับเป็นวินาที)
2. **Cache AI Responses (ประหยัดเงิน):** ถ้าแอดมินหลายคนกดฟีเจอร์ AVM คำนวณราคาของบ้านโครงการเดียวกันซ้ำๆ สับไปสับมา ควรใช้ Upstash Redis เก็บ Cache ผลลัพธ์ AI ไว้ 24 ชั่วโมง เพื่อส่งคืนให้ทันทีโดยไม่เสียเงินเรียก API ค่ายใหญ่ซ้ำซ้อน
3. **Prompt Validation:** ทำระบบกลั่นกรองคำใน Backend ก่อนโยนไปหา API ปลายทาง เพื่อล้างข้อมูลและป้องกันประโยคคำสั่งซ้อน (Instruction Override) ที่คนจงใจพิมพ์แกล้ง

---

## 9. 🗃️ Testing Fragility in DB-Centric Architecture (วิกฤตการ Test ฐานข้อมูลระเบิด)

**🔴 ปัญหา (The Risk):**
คุณได้ย้ายกลไกซับซ้อน (เช่น การตรวจสอบสต็อกบ้าน, การย้ายดีล, หรือ Atomic transactions) ไปเป็น PostgreSQL RPC ซึ่งเป็นวิธีที่เจ๋ง แต่อุปสรรคปัญหาของมันคือ **"การเขียน Unit Test บน Frontend (Vitest) จะหลอกตัวเอง"**
การเอาโค้ดมารันเทสต์บน Vitest มันเป็นการรันลอยๆ (Mocked DB) เมื่อนำไป Deploy ของจริงบน Vercel เจอกับ DB จริงที่มี Trigger ห้าม หรือ RPC ขัดแย้ง โค้ดที่ Test ผ่านฉลุยอาจจะพังตอนคนกดใช้จริง

**🟢 วิธีแก้ (Action Plan):**
1. **Supabase Local Development:** บังคับให้ทีม Dev ทุกคนติดตั้ง `supabase cli` และรัน Local Database + Docker เพื่อให้การทดสอบ Integration Test ไหลผ่าน Database หน้าตาเดียวกับของจริง
2. **Database Testing Framework:** เขียน Test ฝั่ง PostgreSQL โดยตรงโดยใช้ `pgTAP` (สุดยอดไลบรารีสำหรับเทสต์ Database) เพื่อยืนยันว่าการทำงานของ Trigger และ RPC ส่งผลคืนค่าที่ถูกต้องจริงๆ แทนที่จะเทสต์แค่ฝั่ง Node.js
3. **E2E บนฐานข้อมูลจำลอง (Staging Test Drive):** ปรับ Playwright (ที่มีในระบบ) ให้ไปรันยิง Database Environment ตัว Staging เพื่อให้มั่นใจ 100% ว่า Frontend กับ RPC คุยกันรู้เรื่องตลอดการใช้งาน

---

## 10. 📁 ไฟล์อันตราย และ Contract Security (ช่องโหว่อัปโหลด PDF)

**🔴 ปัญหา (The Risk):**
เห็นแผนระบบพูดถึงฟีเจอร์ "E-Signature" และ "เอกสาร/สลิป" แน่นอนว่าการกดอัปโหลดรูปบ้านด้วย Image Compression หน้าบ้านทำได้ดีแล้ว แต่กับการให้ Users/Agents สั่งอัปโหลดไฟล์ PDF (ใบจอง, สัญญา) เป็นเรื่องน่ากลัวมาก หากบางคนนำไฟล์มัลแวร์ฝังโค้ด (Malicious PDF) สวมรอยขึ้น Storage แล้วส่งลิงก์ให้ผู้บริหารกด

**🟢 วิธีแก้ (Action Plan):**
1. **Server-side MIME Verification:** อย่าเชื่อใจนามสกุล หรือ Content-Type จากหน้าบ้าน เมื่ออัปโหลดเข้า Storage ให้ตรวจสอบ Magic bytes ที่ต้นฉบับหลังบ้านเพื่อการันตีว่าเป็น PDF หรือ Image เท่านั้น
2. **Virus-Scanning on Upload (Advanced):** สั่งให้ Inngest ใช้งาน Background Webhook วิ่งไปสแกนไวรัส (เช่นผ่าน ClamAV API) ทุกครั้งที่ไฟล์ถูกนำขึ้น หากเจอก็ตั้ง flag ให้ไฟล์นั้น "Quarantined" ทันที ไม่ยอมให้ใครดาวน์โหลดผ่าน UI
3. **Signed URLs เท่านั้น (No public index):** ทำดีแล้วที่ล็อกโฟลเดอร์เป็น Private สำหรับไฟล์มีมูลค่า แต่ต้องระวังอย่าเผลอปล่อย Signed URLs ให้มีอายุนานเกินไป (ควรตั้งอายุลิงก์ไม่เกิน 5-10 นาที หลังจากคลิกเพื่อจำกัดการเซฟลิงก์ไปแจกจ่าย)
