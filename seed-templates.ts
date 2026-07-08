import { createAdminClient } from "./lib/supabase/admin";

async function seedTemplates() {
  const supabase = createAdminClient();

  const templates = [
    {
      name: "ใบจองทรัพย์ (Property Reservation)",
      description: "แบบฟอร์มใบจองทรัพย์เบื้องต้น ดึงข้อมูลจากดีลและลูกค้า",
      type: "RESERVATION_DOCUMENT" as const,
      content: `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
  
  :root {
    --primary-color: #0c4a6e;
    --border-color: #e2e8f0;
  }

  * { box-sizing: border-box; }

  body { 
    font-family: 'Sarabun', sans-serif; 
    line-height: 1.4; 
    color: #1e293b; 
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    background-color: #f1f5f9;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm;
    margin: 10mm auto;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media print {
    body { background: none; margin: 0; padding: 0; }
    .page {
      margin: 0;
      box-shadow: none;
      width: 210mm;
      height: 297mm;
      padding: 10mm;
    }
    @page {
      size: A4;
      margin: 0;
    }
    .no-print { display: none; }
  }

  h1, h2, h3 { color: var(--primary-color); text-align: center; margin: 0 0 10px 0; }
  
  img { max-width: 100%; height: auto; }

  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
  th, td { border: 1px solid var(--border-color); padding: 6px 10px; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; }
  
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>

<div class="content-wrapper">
  <div style="display: flex; flex-direction: column; min-height: 100%;">
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; border: none;">
          <img src="{{config.logo}}" alt="Logo" style="height: 60px; margin-bottom: 10px;">
          <div style="font-size: 11px; color: #666;">
            <strong>{{config.company}}</strong><br>
            {{config.contact.address}}
          </div>
        </td>
        <td style="width: 50%; text-align: right; vertical-align: top; border: none;">
          <div style="font-size: 10px; color: #999; margin-bottom: 5px;">Original</div>
          <div style="font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px;">{{t.reservation_form}}</div>
          <table style="width: 100%; font-size: 12px; margin: 0; border-collapse: collapse;">
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 10px; border: none;">{{t.date}}</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{date.today}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 10px; border: none;">ID</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{document_number}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 10px; border: none;">Project</td>
              <td style="text-align: left; font-weight: bold; border: none; color: #4f46e5;">{{project.name}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="text-align: center; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 5px; margin-bottom: 15px; font-size: 16px;">{{t.reservation_form}}</h3>

    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px;">
      <div style="width: 45%;">
        <span style="color: #666;">{{t.reserved_by}}:</span> <span style="font-weight: bold;">{{lead.full_name}}</span><br>
        <span style="color: #666;">{{t.phone}}:</span> <span>{{lead.phone}}</span><br>
        <span style="color: #666;">Line ID:</span> <span>{{lead.line_id}}</span>
        {{lead.identity_info}}
      </div>
      <div style="width: 50%; padding: 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 3px;">{{t.property_details}}</div>
        <div style="font-size: 12px; font-weight: bold; color: #0c4a6e; margin-bottom: 3px;">{{property.title}}</div>
        <div style="font-size: 11px; color: #475569;">
          <strong>{{t.floor}}:</strong> {{property.floor || "-"}} | 
          <strong>{{t.unit}}:</strong> {{property.unit_number || property.unit || "-"}}<br>
          <strong>{{t.bedrooms}}:</strong> {{property.bedrooms || "0"}} {{t.bed}} | 
          <strong>{{t.bathrooms}}:</strong> {{property.bathrooms || "0"}} {{t.bath}} | 
          <strong>{{t.size_sqm}}:</strong> {{property.size_sqm || "-"}}
        </div>
      </div>
    </div>

    <!-- Financial Table -->
    {{financial_table_html}}

    <!-- Bank & Payment Detail -->
    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #c7d2fe; border-radius: 8px; background-color: #eff6ff; font-size: 12px;">
      <div style="display: flex; justify-content: space-between;">
        <div><span style="color: #666;">{{t.bank}}:</span> <strong>{{bank_name}}</strong></div>
        <div><span style="color: #666;">{{t.account_no}}:</span> <strong>{{bank_account_no}}</strong></div>
        <div><span style="color: #666;">{{t.account_name}}:</span> <strong>{{account_name}}</strong></div>
      </div>
      <div style="margin-top: 5px;"><span style="color: #666;">{{t.payment_method}}:</span> <strong>{{payment_method}}</strong></div>
    </div>

    <!-- Transfer Slip (conditional) -->
    {{slip_html}}

    <div style="margin-top: auto;">
      <!-- Terms -->
      <div style="font-size: 10px; color: #666; line-height: 1.4; margin-bottom: 15px; padding: 10px; background-color: #fff9f0; border-radius: 5px;">
        <strong style="color: #d97706;">{{t.terms_conditions}}:</strong>
        <ol style="margin: 5px 0 0 15px; padding: 0;">
          <li>{{terms_deposit}}</li>
          <li>{{terms_sign_by}} <strong>{{deal.contract_due_date}}</strong></li>
          <li>{{terms_payment_transfer}}</li>
        </ol>
      </div>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
        <div style="text-align: center; width: 30%;">
          <div style="border-bottom: 1px solid #333; height: 25px; margin-bottom: 5px;"></div>
          <div style="font-size: 10px;">{{t.customer_signature}}</div>
        </div>
        <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
          <img src="{{config.logo}}" style="height: 50px; object-fit: contain; margin-bottom: 5px;" alt="Company">
          <div style="font-size: 9px; color: #999;">{{config.company}}</div>
        </div>
        <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
          <div style="border-bottom: 1px solid #333; width: 100%; height: 25px; margin-bottom: 5px;"></div>
          <div style="font-size: 10px;">{{t.agent_signature}}</div>
        </div>
      </div>
    </div>
  </div>
</div>
`.trim(),
    },
    {
      name: "ใบเสร็จค่าเช่า (Rent Receipt)",
      description: "แบบฟอร์มใบเสร็จรับเงินค่าเช่าและค่ามัดจำ ดึงข้อมูลจากดีลและลูกค้า",
      type: "RENT_RECEIPT" as const,
      content: `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
  
  :root {
    --primary-color: #0c4a6e;
    --border-color: #e2e8f0;
  }

  * { box-sizing: border-box; }

  body { 
    font-family: 'Sarabun', sans-serif; 
    line-height: 1.4; 
    color: #1e293b; 
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    background-color: #f1f5f9;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm;
    margin: 10mm auto;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media print {
    body { background: none; margin: 0; padding: 0; }
    .page {
      margin: 0;
      box-shadow: none;
      width: 210mm;
      height: 297mm;
      padding: 10mm;
    }
    @page {
      size: A4;
      margin: 0;
    }
    .no-print { display: none; }
  }

  h1, h2, h3 { color: var(--primary-color); text-align: center; margin: 0 0 10px 0; }
  
  img { max-width: 100%; height: auto; }

  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
  th, td { border: 1px solid var(--border-color); padding: 6px 10px; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; }
  
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>

<div class="content-wrapper">
  <div style="display: flex; flex-direction: column; min-height: 100%;">
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; border: none;">
          <img src="{{config.logo}}" alt="Logo" style="height: 60px; margin-bottom: 10px;">
          <div style="font-size: 11px; color: #666;">
            <strong>{{config.company}}</strong><br>
            {{config.contact.address}}
          </div>
        </td>
        <td style="width: 50%; text-align: right; vertical-align: top; border: none;">
          <div style="font-size: 10px; color: #999; margin-bottom: 5px;">Original</div>
          <div style="font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 10px;">{{t.rent_receipt}}</div>
          <table style="width: 100%; font-size: 12px; margin: 0; border-collapse: collapse;">
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 10px; border: none;">{{t.date}}</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{date.today}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 10px; border: none;">ID</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{document_number}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 10px; border: none;">Project</td>
              <td style="text-align: left; font-weight: bold; border: none; color: #10b981;">{{project.name}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="text-align: center; color: #059669; border-bottom: 2px solid #a7f3d0; padding-bottom: 5px; margin-bottom: 15px; font-size: 16px;">{{t.rent_receipt}}</h3>

    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px;">
      <div style="width: 45%;">
        <span style="color: #666;">{{t.client}}:</span> <span style="font-weight: bold;">{{lead.full_name}}</span><br>
        <span style="color: #666;">{{t.phone}}:</span> <span>{{lead.phone}}</span><br>
        <span style="color: #666;">Line ID:</span> <span>{{lead.line_id}}</span>
        {{lead.identity_info}}
      </div>
      <div style="width: 50%; padding: 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 3px;">{{t.property_details}}</div>
        <div style="font-size: 12px; font-weight: bold; color: #065f46; margin-bottom: 3px;">{{property.title}}</div>
        <div style="font-size: 11px; color: #475569;">
          <strong>{{t.floor}}:</strong> {{property.floor || "-"}} | 
          <strong>{{t.unit}}:</strong> {{property.unit_number || property.unit || "-"}}<br>
          <strong>{{t.bedrooms}}:</strong> {{property.bedrooms || "0"}} {{t.bed}} | 
          <strong>{{t.bathrooms}}:</strong> {{property.bathrooms || "0"}} {{t.bath}} | 
          <strong>{{t.size_sqm}}:</strong> {{property.size_sqm || "-"}}
        </div>
      </div>
    </div>

    <!-- Financial Table -->
    {{financial_table_html}}

    <!-- Bank & Payment Detail -->
    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #a7f3d0; border-radius: 8px; background-color: #ecfdf5; font-size: 12px;">
      <div style="display: flex; justify-content: space-between;">
        <div><span style="color: #666;">{{t.bank}}:</span> <strong>{{bank_name}}</strong></div>
        <div><span style="color: #666;">{{t.account_no}}:</span> <strong>{{bank_account_no}}</strong></div>
        <div><span style="color: #666;">{{t.account_name}}:</span> <strong>{{account_name}}</strong></div>
      </div>
      <div style="margin-top: 5px;"><span style="color: #666;">{{t.payment_method}}:</span> <strong>{{payment_method}}</strong></div>
    </div>

    <!-- Transfer Slip (conditional) -->
    {{slip_html}}

    <div style="margin-top: auto;">
      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
        <div style="text-align: center; width: 30%;">
          <div style="border-bottom: 1px solid #333; height: 25px; margin-bottom: 5px;"></div>
          <div style="font-size: 10px;">{{t.customer_signature}}</div>
        </div>
        <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
          <img src="{{config.logo}}" style="height: 50px; object-fit: contain; margin-bottom: 5px;" alt="Company">
          <div style="font-size: 9px; color: #999;">{{config.company}}</div>
        </div>
        <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
          <div style="border-bottom: 1px solid #333; width: 100%; height: 25px; margin-bottom: 5px;"></div>
          <div style="font-size: 10px;">{{t.authorized_signature}}</div>
        </div>
      </div>
    </div>
  </div>
</div>
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

  console.log("Seeding templates into cms_content_v3...");

  // Get a system author ID if possible to assign as author
  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  const authorId = profiles?.[0]?.id || "2504d7ce-1d15-4cc4-b079-db6378cb2f2d"; // Fallback to baseline default author

  for (const template of templates) {
    // Generate an slug based on name
    const slug = template.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

    // Check if exists in cms_content_v3
    const { data: existing } = await supabase
      .from("cms_content_v3")
      .select("id")
      .eq("content_type", "CONTRACT_TEMPLATE")
      .eq("slug", slug)
      .single();

    const dbRecord = {
      content_type: "CONTRACT_TEMPLATE",
      slug: slug,
      title: { th: template.name, en: template.name },
      content: { th: template.content, en: template.content },
      meta_data: {
        excerpt: template.description || "",
        category: template.type
      },
      status: "PUBLISHED",
      author_id: authorId,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      console.log(`Updating existing template in cms_content_v3: ${template.name}`);
      await supabase
        .from("cms_content_v3")
        .update(dbRecord)
        .eq("id", existing.id);
    } else {
      console.log(`Inserting new template into cms_content_v3: ${template.name}`);
      await supabase.from("cms_content_v3").insert([
        {
          ...dbRecord,
          created_at: new Date().toISOString()
        }
      ]);
    }
  }

  console.log("Seeding completed successfully.");
}

seedTemplates();
