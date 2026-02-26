import { createAdminClient } from "./lib/supabase/admin";

async function seedTemplates() {
  const supabase = createAdminClient();

  const reservationTemplate = {
    name: "ใบจองทรัพย์ (Property Reservation)",
    description: "แบบฟอร์มใบจองทรัพย์เบื้องต้น ดึงข้อมูลจากดีลและลูกค้า",
    type: "RESERVATION_DOCUMENT" as const,
    content: `
<h1>ใบจองซื้อ/เช่าอสังหาริมทรัพย์</h1>
<p>ทำที่: {{office.name || "สำนักงานใหญ่"}}</p>
<p>วันที่: {{date.today}}</p>

<p>ข้าพเจ้า <strong>{{lead.full_name}}</strong> สนใจจองทรัพย์สินรายการ:</p>
<p>ทรัพย์สิน: {{property.title}}</p>
<p>ราคาขาย/เช่า: {{deal.formatted_price}} บาท</p>

<p>โดยมีเงื่อนไขการจองดังนี้:</p>
<ul>
  <li>ค่าจองจำนวน: {{deal.reservation_fee || "____________"}} บาท</li>
  <li>กำหนดทำสัญญาภายในวันที่: {{deal.contract_date || "____________"}}</li>
</ul>

<p>ลงชื่อ......................................................ผู้จอง</p>
<p>( {{lead.full_name}} )</p>
    `.trim(),
  };

  const { data, error } = await supabase
    .from("contract_templates")
    .insert([reservationTemplate as any])
    .select();

  if (error) {
    console.error("Seed Error:", error);
  } else {
    console.log("Seed Success:", data);
  }
}

seedTemplates();
