import { createAdminClient } from "./lib/supabase/admin";

async function seedTemplates() {
  const supabase = createAdminClient();

  const templates = [
    {
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
    },
    {
      name: "สัญญาเช่าอสังหาริมทรัพย์ (Lease Contract)",
      description: "สัญญาเช่ามาตรฐานสำหรับที่พักอาศัย",
      type: "LEASE_CONTRACT" as const,
      content: `
<h1>สัญญาเช่าอสังหาริมทรัพย์</h1>
<p>สัญญาฉบับนี้ทำขึ้นเมื่อวันที่ {{date.today}}</p>
<p>ระหว่าง <strong>{{owner.name || "เจ้าของทรัพย์"}}</strong> (ผู้เช่า) และ <strong>{{lead.full_name}}</strong> (ผู้เช่า)</p>

<p>โดยมีรายละเอียดดังนี้:</p>
<ol>
  <li>ทรัพย์สินที่เช่า: {{property.title}} ตั้งอยู่ที่ {{property.address || "___________"}}</li>
  <li>ระยะเวลาเช่า: {{deal.lease_term || "1 ปี"}} เริ่มตั้งแต่วันที่ {{deal.start_date || "___________"}}</li>
  <li>ค่าเช่ารายเดือน: {{deal.formatted_price}} บาท</li>
  <li>เงินประกันการเช่า: {{deal.security_deposit || "___________"}} บาท</li>
</ol>

<p>ลงชื่อ......................................................ผู้ให้เช่า</p>
<br/>
<p>ลงชื่อ......................................................ผู้เช่า</p>
    `.trim(),
    },
    {
      name: "สัญญาซื้อขาย (Sale & Purchase Agreement)",
      description: "สัญญาจะซื้อจะขายอสังหาริมทรัพย์",
      type: "SALE_CONTRACT" as const,
      content: `
<h1>สัญญาจะซื้อจะขายอสังหาริมทรัพย์</h1>
<p>ทำขึ้น ณ {{date.today}}</p>
<p>ผู้จะซื้อ: {{lead.full_name}}</p>
<p>ผู้จะขาย: {{owner.name || "เจ้าของทรัพย์"}}</p>

<p>ผู้จะขายตกลงขายและผู้จะซื้อตกลงซื้อทรัพย์สินคือ {{property.title}} ในราคา {{deal.formatted_price}} บาท</p>

<p>การชำระเงิน:</p>
<ul>
  <li>ในวันทำสัญญานี้ ผู้จะซื้อได้วางมัดจำเงินจำนวน {{deal.deposit_amount || "___________"}} บาท</li>
  <li>ส่วนที่เหลือจำนวน {{deal.balance_amount || "___________"}} บาท จะชำระในวันจดทะเบียนโอนกรรมสิทธิ์</li>
</ul>

<p>ลงชื่อ......................................................ผู้จะขาย</p>
<br/>
<p>ลงชื่อ......................................................ผู้จะซื้อ</p>
    `.trim(),
    },
  ];

  console.log("Seeding templates...");

  for (const template of templates) {
    // Check if exists
    const { data: existing } = await supabase
      .from("contract_templates")
      .select("id")
      .eq("name", template.name)
      .single();

    if (existing) {
      console.log(`Updating existing template: ${template.name}`);
      await supabase
        .from("contract_templates")
        .update({ ...template, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      console.log(`Inserting new template: ${template.name}`);
      await supabase.from("contract_templates").insert([template]);
    }
  }

  console.log("Seeding completed successfully.");
}

seedTemplates();
