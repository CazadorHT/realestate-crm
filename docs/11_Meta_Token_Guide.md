# คู่มือการดึง Page Access Token (แบบเจาะจง)

> **อัปเดตล่าสุด:** 4 มีนาคม 2026

หากคุณพบปัญหาใน Graph API Explorer ที่กดเลือกเพจแล้วระบบเด้งกลับมาเป็น **User Token** ตลอดเวลา หรือไม่แสดงรายชื่อเพจให้เลือก ให้ใช้คู่มือนี้ในการ "เจาะ" เอากุญแจเพจออกมาครับ

## 1. สาเหตุที่ระบบเด้งกลับ (Bouncing)

- **Pop-up Blocker**: เบราว์เซอร์บล็อกหน้าต่างเลือกเพจของ Facebook (สังเกตไอคอนกากบาทแดงที่แถบ URL)
- **Missing `pages_show_list`**: กุญแจ User Token ปัจจุบันยังไม่มีสิทธิ์ "ขอดูรายชื่อเพจ"
- **Login Session**: เซสชันของ Facebook ใน Explorer หมดอายุหรือรวน

---

## 2. วิธี "เจาะ" เอากุญแจเพจ (Manual Method)

หากระบบอัตโนมัติใช้ไม่ได้ ให้ใช้คำสั่งขุดข้อมูลด้วยตัวเองตามขั้นตอนนี้ครับ:

### ขั้นตอนที่ ก: ตรวจสอบสิทธิ์เบื้องต้น

1. ที่ช่อง **Permissions** ด้านล่างสุด ต้องมีสิทธิ์เหล่านี้ (เป็นกากบาทสีเขียว):
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_messaging` (สำหรับ Comment-to-DM / Private Reply)
   - `pages_manage_metadata` (สำหรับ Webhook Subscription)
   - `instagram_basic` (สำหรับ Instagram Business)
   - `instagram_content_publish` (สำหรับโพสต์ลง IG)
   - `instagram_manage_comments` (สำหรับ Keyword Automation)
2. หากยังไม่มี ให้พิมพ์หาแล้วกด **Generate Access Token** (ปุ่มสีฟ้า) 1 รอบ เพื่อให้ User Token มีสิทธิ์เหล่านี้ก่อน

### ขั้นตอนที่ ข: ขุด ID ของเพจทั้งหมด

1. ในช่องกรอก URL ของ Explorer (ข้างๆ คำว่า `GET`) ให้พิมพ์:
   `me/accounts`
2. กดปุ่ม **"ส่ง" (Submit)**
3. ระบบจะแสดงรายการเพจทั้งหมดที่คุณเป็นแอดมิน ให้มองหาชื่อเพจของคุณ แล้วก๊อปปี้รหัส **`id`** ของเพจนั้นไว้

### ขั้นตอนที่ ค: เจาะเอากุญแจ (Page Token)

1. นำ ID เพจที่ได้จากขั้นตอนที่แล้ว มาพิมพ์ในช่อง URL แทนที่ของเดิม ดังนี้:
   `[ID_เพจ_ของคุณ]?fields=access_token`
   _(ตัวอย่าง: `111608617234370?fields=access_token`)_
2. กดปุ่ม **"ส่ง" (Submit)** อีกครั้ง
3. รหัสยาวๆ ที่ปรากฏในช่อง `access_token` คือกุญแจเพจสำหรับใช้งานใน `.env` ครับ

---

## 3. วิธีตรวจสอบความถูกต้อง

นำกุญแจที่ได้ไปวางใน [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

- **Type**: ต้องเป็น `Page` เท่านั้น
- **Profile ID**: ต้องตรงกับ ID ของเพจคุณ
- **Scopes**: ต้องมีสิทธิ์ `pages_manage_posts` และ `instagram_content_publish` (สำหรับ IG)

---

> [!TIP]
> **อายุของกุญแจ**: กุญแจที่ได้จาก Explorer มักจะเป็นชั่วคราว (Short-lived) หากต้องการกุญแจที่ไม่มีวันหมดอายุ (Never Expire) ให้กดยืนยันตัวตนในหน้า Business Manager หรือใช้กุญแจจาก System User ในบัญชีธุรกิจครับ

🛠 ขั้นตอนการขุด Page Token (ทำในหน้า Explorer):
ในช่อง Address Bar ของ Explorer (ข้างๆ คำว่า GET และ v25.0)
ให้ลบข้อความเดิมออก แล้วพิมพ์คำว่า: me/accounts ลงไปแทนครับ
กดปุ่ม "ส่ง" (ปุ่มสีฟ้าขวาสุด)
คุณ Hunter จะเห็นข้อมูลในช่องสีขาว (JSON) เด้งขึ้นมาเพียบเลย ให้เลื่อนหาจุดนี้ครับ:
หาคำว่า "name": "VC Connect Asset"
ใต้บรรทัดนั้น จะมีคำว่า "access_token": "..."
ก๊อปปี้รหัสยาวๆ ในเครื่องหมายคำพูดหลังคำว่า access_token (ของเพจนี้เท่านั้นนะ) มาครับ

วิธี "เจาะ" เอากุญแจเพจแบบระบุตัวตน (ในหน้า Explorer):
ในช่อง Address Bar ของ Explorer (ที่พิมพ์ me/accounts ตะกี้)
ให้ลบของเดิมแล้วพิมพ์เลข ID เพจลงไปตามนี้เลยครับ:
👉 111608617234370?fields=access_token
