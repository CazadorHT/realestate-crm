# Project TODOs ✅

# Step 4 งานที่เราจะโค้ด 
A) DB layer (lib/db)
- [x] getAllLeads()
- [x] getLeadById(id)
- [x] updateLead(id, values)
- [x] getLeadActivities(leadId)
- [x] createLeadActivity(leadId, values)

B) UI (components)
- [x] LeadForm (แก้ไข Lead)
- [x] LeadTimeline + ActivityForm (เพิ่มกิจกรรม)

C) Pages (app router)
- [x] /protected/leads (ตาราง leads)
- [x] /protected/leads/[id] (รายละเอียด lead + timeline + ฟอร์ม)

# new 

- [x] หน้า labels แก้ *_ORDER ให้เป็น “tuple literal” จริง (ห้ามใส่ : PropertyType[]) กำลังทำ as const satisfies readonly PropertyStatus[] 

- [x] แก้ property form ให้ดึง select option จาก db แต่ติด error อยู่
แต่ตอนนี้ ดึงออกมาแสดงได้แล้ว แต่ยังไม่เรียบร้อย

- [ ] อยากลบ latitude, longitude ออกจาก form และ db เพราะไม่จำเป็น แต่อยากได้ Col: เก็บ link google map แทน แล้วแสดงตำแหน่งที่ตั้งของ property ที่หน้าเว็บ (property detail / public web )

- [x] เจอ Console Error แจ้ง error ของ dialog
        `DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

        If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.

        For more information, see https://radix-ui.com/primitives/docs/components/dialog
        omponents/ui/dialog.tsx (60:7) @ DialogContent


        58 |     <DialogPortal data-slot="dialog-portal">
        59 |       <DialogOverlay />
        > 60 |       <DialogPrimitive.Content
            |       ^
        61 |         data-slot="dialog-content"
        62 |         className={cn(

- [x] ตอนนี้กำลังไล่ลดความเสี่ยงปิดช่องโหว่อยู่ ตอนนี้ทำถึง step 3 
- [x] Step 1 : Auth + Authorization ให้เป็นมาตรฐานเดียว /สร้างไฟล์กลางสำหรับ AuthZ [lib/authz.ts] / แยก Public vs Protected อ่านทรัพย์ + รูป
- [x] Step 2 : Server-side validation ด้วย Zod safeParse
- [x] Step 3 : “เรียกใช้” validate/existence/rollback ใน createPropertyAction (ตอนนี้ insert images แล้ว error ก็แค่ log)
- [x] Step 4 : cleanup storage ให้ไม่เกิดไฟล์ orphan (กรณีอัปโหลดแล้วกดยกเลิก/ลบก่อนเซฟ) สรุป Step 4.0–4.4 (สั้น กระชับ)
- [x] [4.0] เป้าหมาย: กันไฟล์รูป “ค้างใน Storage (orphan)” จากการอัปโหลดแล้วไม่กดบันทึก/ลบรูป/ยกเลิก
- [x] [4.1] เพิ่มตาราง property_image_uploads: เก็บ tracking รูปที่อัปโหลดแบบ TEMP/ATTACHED พร้อม RLS (owner/admin)
- [x] [4.2] ตอนอัปโหลดรูป: uploadPropertyImageAction รับ sessionId แล้ว
- [x] [4.2.1] อัปโหลดเข้า bucket property-images
- [x] [4.2.2] insert row เป็น TEMP ทันที (ก่อน submit)
- [x] [4.2.3] ถ้า insert ไม่ผ่าน → ลบไฟล์ใน storage ทิ้ง (กัน orphan ตั้งแต่ต้น)
- [x] [4.3] ตอน submit สำเร็จ (create/update): finalizeUploadSession
- [x] [4.3.1] รูปที่ใช้จริง → เปลี่ยนเป็น ATTACHED + ใส่ property_id
- [x] [4.3.2] รูป TEMP ที่ไม่ใช้ → ลบจาก Storage + ลบ row TEMP
- [x] [4.4] ตอนกดยกเลิก: cleanupUploadSessionAction(sessionId)
- [x] [4.4.1] ลบ TEMP ทั้ง session จาก Storage + ลบ row TEMP แล้วค่อยออกหน้า (ทำแบบไม่ block UX ได้)
- [x] [4.5] เก็บกวาด TEMP ที่ค้างจาก “ปิดแท็บ/ไม่ submit/ไม่กดยกเลิก” ด้วย scheduled cleanup.
- [ ] Step 5 : 
- [ ] Step 6 : 
- [ ] Step 7 : 
- [ ] Step 8 : 
- [ ] Step 9 : 
- [ ] Step 10 : 

