import * as dotenv from "dotenv";
dotenv.config();
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
    padding: 6mm 10mm 15mm 10mm;
    margin: 20px auto;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  @page {
    size: A4;
    margin: 6mm 10mm 15mm 10mm;
  }

  @media print {
    body { 
      background: white !important; 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page {
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: initial !important;
      overflow: visible !important;
    }
    .no-print { display: none !important; }
  }

  h1, h2, h3 { color: var(--primary-color); text-align: center; margin: 0 0 10px 0; }
  
  img { max-width: 100%; height: auto; }

  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
  th, td { border: 1px solid var(--border-color); padding: 5px 8px; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; }
  
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
  }
</style>

<div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-height: 100%;">
  <div style="display: flex; flex-direction: column;">
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <tr>
        <td style="width: 50%; vertical-align: top; border: none;">
          <img src="{{config.logo}}" alt="Logo" style="height: 55px; margin-bottom: 8px; object-fit: contain;">
          <div style="font-size: 11px; color: #666; line-height: 1.3;">
            <strong>{{config.company}}</strong><br>
            {{config.contact.address}}
          </div>
        </td>
        <td style="width: 50%; text-align: right; vertical-align: top; border: none;">
          <div style="font-size: 10px; color: #999; margin-bottom: 3px;">Original</div>
          <div style="font-size: 22px; font-weight: bold; color: #4f46e5; margin-bottom: 8px;">{{document_title || t.reservation_form}}</div>
          <table style="width: 100%; font-size: 11px; margin: 0; border-collapse: collapse;">
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">{{t.date}}</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{date.today}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">ID</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{document_number}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">Project</td>
              <td style="text-align: left; font-weight: bold; border: none; color: #4f46e5;">{{project.name}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="text-align: center; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 4px; margin-bottom: 10px; font-size: 15px;">{{document_title || t.reservation_form}}</h3>

    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px;">
      <div style="width: 45%; line-height: 1.4;">
        <span style="color: #666;">{{t.reserved_by}}:</span> <span style="font-weight: bold;">{{lead.full_name}}</span>
        {{lead.contact_info_html}}
        {{lead.identity_info}}
      </div>
      <div style="width: 52%; padding: 8px 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; line-height: 1.35;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">{{t.property_details}}</div>
        <div style="font-size: 12px; font-weight: bold; color: #0c4a6e; margin-bottom: 3px;">{{project.full_name || project.name || property.title}}</div>
        <div style="font-size: 11px; color: #475569;">
          <strong>{{t.floor}}:</strong> {{property.floor || "-"}} | 
          <strong>{{t.unit}}:</strong> {{property.unit_number || property.unit || "-"}}<br>
          <strong>{{t.bedrooms}}:</strong> {{property.bedrooms || "0"}} {{t.bed}} | 
          <strong>{{t.bathrooms}}:</strong> {{property.bathrooms || "0"}} {{t.bath}} | 
          <strong>{{t.size || "Size"}}:</strong> {{property.size_sqm || "-"}} {{t.sqm || "Sq.m."}}
        </div>
      </div>
    </div>

    <!-- Financial Table -->
    {{financial_table_html}}

    <!-- Bank & Payment Detail -->
    <div style="width: 100%; box-sizing: border-box; margin: 8px 0 10px 0; padding: 7px 14px; border: 1px solid #c7d2fe; border-radius: 6px; background-color: #eff6ff; font-size: 11px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div><span style="color: #666;">{{t.bank}}:</span> <strong>{{bank_name}}</strong></div>
        <div><span style="color: #666;">{{t.account_no}}:</span> <strong>{{bank_account_no}}</strong></div>
        <div><span style="color: #666;">{{t.account_name}}:</span> <strong>{{account_name}}</strong>{{payee_role_badge}}</div>
        <div><span style="color: #666;">{{t.payment_method}}:</span> <strong>{{payment_method}}</strong></div>
      </div>
    </div>

    <!-- Transfer Slip (conditional) -->
    {{slip_html}}
  </div>

  <div style="margin-top: auto; padding-top: 10px; page-break-inside: avoid;">
    <!-- Terms -->
    <div style="font-size: 10px; color: #666; line-height: 1.35; margin-bottom: 10px; padding: 6px 10px; background-color: #fff9f0; border-radius: 6px; page-break-inside: avoid;">
      <strong style="color: #d97706;">{{t.terms_conditions}}:</strong>
      <ol style="margin: 3px 0 0 15px; padding: 0;">
        <li>{{terms_deposit}}</li>
        <li>{{terms_sign_by}} <strong>{{deal.contract_due_date}}</strong></li>
        <li>{{terms_payment_transfer}}</li>
      </ol>
    </div>

    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; page-break-inside: avoid;">
      <div style="text-align: center; width: 30%;">
        <div style="border-bottom: 1px solid #333; height: 22px; margin-bottom: 4px;"></div>
        <div style="font-size: 10px;">{{t.customer_signature}}</div>
      </div>
      <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
        <img src="{{config.logo}}" style="height: 42px; object-fit: contain; margin-bottom: 4px;" alt="Company">
        <div style="font-size: 9px; color: #999;">{{config.company}}</div>
      </div>
      <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
        <div style="border-bottom: 1px solid #333; width: 100%; height: 22px; margin-bottom: 4px;"></div>
        <div style="font-size: 10px;">{{t.agent_signature}}</div>
      </div>
    </div>
  </div>
</div>
`.trim(),
    },
    {
      name: "ใบเสร็จค่าเช่า / ใบเสร็จรับเงิน (Rent Receipt / Receipt)",
      description: "แบบฟอร์มใบเสร็จรับเงินค่าเช่า ค่ามัดจำ ประกันสัตว์เลี้ยง คีย์การ์ด และค่าบริการต่างๆ",
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
    padding: 6mm 10mm 15mm 10mm;
    margin: 20px auto;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  @page {
    size: A4;
    margin: 6mm 10mm 15mm 10mm;
  }

  @media print {
    body { 
      background: white !important; 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page {
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: initial !important;
      overflow: visible !important;
    }
    .no-print { display: none !important; }
  }

  h1, h2, h3 { color: var(--primary-color); text-align: center; margin: 0 0 10px 0; }
  
  img { max-width: 100%; height: auto; }

  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
  th, td { border: 1px solid var(--border-color); padding: 5px 8px; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; }
  
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
  }
</style>

<div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-height: 100%;">
  <div style="display: flex; flex-direction: column;">
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <tr>
        <td style="width: 50%; vertical-align: top; border: none;">
          <img src="{{config.logo}}" alt="Logo" style="height: 55px; margin-bottom: 8px; object-fit: contain;">
          <div style="font-size: 11px; color: #666; line-height: 1.3;">
            <strong>{{config.company}}</strong><br>
            {{config.contact.address}}
          </div>
        </td>
        <td style="width: 50%; text-align: right; vertical-align: top; border: none;">
          <div style="font-size: 10px; color: #999; margin-bottom: 3px;">Original</div>
          <div style="font-size: 22px; font-weight: bold; color: #10b981; margin-bottom: 8px;">{{document_title || t.rent_receipt}}</div>
          <table style="width: 100%; font-size: 11px; margin: 0; border-collapse: collapse;">
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">{{t.date}}</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{date.today}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">ID</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{document_number}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">Project</td>
              <td style="text-align: left; font-weight: bold; border: none; color: #10b981;">{{project.name}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="text-align: center; color: #059669; border-bottom: 2px solid #a7f3d0; padding-bottom: 4px; margin-bottom: 10px; font-size: 15px;">{{document_title || t.rent_receipt}}</h3>

    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px;">
      <div style="width: 45%; line-height: 1.4;">
        <span style="color: #666;">{{t.client}}:</span> <span style="font-weight: bold;">{{lead.full_name}}</span>
        {{lead.contact_info_html}}
        {{lead.identity_info}}
      </div>
      <div style="width: 52%; padding: 8px 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; line-height: 1.35;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">{{t.property_details}}</div>
        <div style="font-size: 12px; font-weight: bold; color: #065f46; margin-bottom: 3px;">{{project.full_name || project.name || property.title}}</div>
        <div style="font-size: 11px; color: #475569;">
          <strong>{{t.floor}}:</strong> {{property.floor || "-"}} | 
          <strong>{{t.unit}}:</strong> {{property.unit_number || property.unit || "-"}}<br>
          <strong>{{t.bedrooms}}:</strong> {{property.bedrooms || "0"}} {{t.bed}} | 
          <strong>{{t.bathrooms}}:</strong> {{property.bathrooms || "0"}} {{t.bath}} | 
          <strong>{{t.size || "Size"}}:</strong> {{property.size_sqm || "-"}} {{t.sqm || "Sq.m."}}
        </div>
      </div>
    </div>

    <!-- Financial Table -->
    {{financial_table_html}}

    <!-- Bank & Payment Detail -->
    <div style="width: 100%; box-sizing: border-box; margin: 8px 0 10px 0; padding: 7px 14px; border: 1px solid #a7f3d0; border-radius: 6px; background-color: #ecfdf5; font-size: 11px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div><span style="color: #666;">{{t.bank}}:</span> <strong>{{bank_name}}</strong></div>
        <div><span style="color: #666;">{{t.account_no}}:</span> <strong>{{bank_account_no}}</strong></div>
        <div><span style="color: #666;">{{t.account_name}}:</span> <strong>{{account_name}}</strong>{{payee_role_badge}}</div>
        <div><span style="color: #666;">{{t.payment_method}}:</span> <strong>{{payment_method}}</strong></div>
      </div>
    </div>

    <!-- Transfer Slip (conditional) -->
    {{slip_html}}
  </div>

  <div style="margin-top: auto; padding-top: 10px; page-break-inside: avoid;">
    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; page-break-inside: avoid;">
      <div style="text-align: center; width: 30%;">
        <div style="border-bottom: 1px solid #333; height: 22px; margin-bottom: 4px;"></div>
        <div style="font-size: 10px;">{{t.customer_signature}}</div>
      </div>
      <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
        <img src="{{config.logo}}" style="height: 42px; object-fit: contain; margin-bottom: 4px;" alt="Company">
        <div style="font-size: 9px; color: #999;">{{config.company}}</div>
      </div>
      <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
        <div style="border-bottom: 1px solid #333; width: 100%; height: 22px; margin-bottom: 4px;"></div>
        <div style="font-size: 10px;">{{t.authorized_signature}}</div>
      </div>
    </div>
  </div>
</div>
`.trim(),
    },
    {
      name: "ใบแจ้งหนี้ (Invoice)",
      description: "แบบฟอร์มใบแจ้งหนี้ / ใบเรียกเก็บเงิน สำหรับค่าเช่า ค่ามัดจำ และค่าบริการต่างๆ",
      type: "INVOICE" as const,
      content: `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
  
  :root {
    --primary-color: #4f46e5;
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
    padding: 6mm 10mm 15mm 10mm;
    margin: 20px auto;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  @page {
    size: A4;
    margin: 6mm 10mm 15mm 10mm;
  }

  @media print {
    body { 
      background: white !important; 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page {
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: initial !important;
      overflow: visible !important;
    }
    .no-print { display: none !important; }
  }

  h1, h2, h3 { color: var(--primary-color); text-align: center; margin: 0 0 10px 0; }
  
  img { max-width: 100%; height: auto; }

  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
  th, td { border: 1px solid var(--border-color); padding: 5px 8px; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; }
  
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
  }
</style>

<div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-height: 100%;">
  <div style="display: flex; flex-direction: column;">
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
      <tr>
        <td style="width: 50%; vertical-align: top; border: none;">
          <img src="{{config.logo}}" alt="Logo" style="height: 55px; margin-bottom: 8px; object-fit: contain;">
          <div style="font-size: 11px; color: #666; line-height: 1.3;">
            <strong>{{config.company}}</strong><br>
            {{config.contact.address}}
          </div>
        </td>
        <td style="width: 50%; text-align: right; vertical-align: top; border: none;">
          <div style="font-size: 10px; color: #999; margin-bottom: 3px;">Original</div>
          <div style="font-size: 22px; font-weight: bold; color: #4f46e5; margin-bottom: 8px;">{{document_title || t.invoice || 'Invoice'}}</div>
          <table style="width: 100%; font-size: 11px; margin: 0; border-collapse: collapse;">
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">{{t.date}}</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{date.today}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">ID</td>
              <td style="text-align: left; font-weight: bold; border: none;">{{document_number}}</td>
            </tr>
            <tr style="border: none;">
              <td style="text-align: right; color: #666; padding-right: 8px; border: none;">Project</td>
              <td style="text-align: left; font-weight: bold; border: none; color: #4f46e5;">{{project.name}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="text-align: center; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 4px; margin-bottom: 10px; font-size: 15px;">{{document_title || t.invoice || 'Invoice'}}</h3>

    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px;">
      <div style="width: 45%; line-height: 1.4;">
        <span style="color: #666;">{{t.billed_to || t.reserved_by}}:</span> <span style="font-weight: bold;">{{lead.full_name}}</span>
        {{lead.contact_info_html}}
        {{lead.identity_info}}
      </div>
      <div style="width: 52%; padding: 8px 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; line-height: 1.35;">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">{{t.property_details}}</div>
        <div style="font-size: 12px; font-weight: bold; color: #0c4a6e; margin-bottom: 3px;">{{project.full_name || project.name || property.title}}</div>
        <div style="font-size: 11px; color: #475569;">
          <strong>{{t.floor}}:</strong> {{property.floor || "-"}} | 
          <strong>{{t.unit}}:</strong> {{property.unit_number || property.unit || "-"}}<br>
          <strong>{{t.bedrooms}}:</strong> {{property.bedrooms || "0"}} {{t.bed}} | 
          <strong>{{t.bathrooms}}:</strong> {{property.bathrooms || "0"}} {{t.bath}} | 
          <strong>{{t.size || "Size"}}:</strong> {{property.size_sqm || "-"}} {{t.sqm || "Sq.m."}}
        </div>
      </div>
    </div>

    <!-- Financial Table -->
    {{financial_table_html}}

    <!-- Bank & Payment Detail -->
    <div style="width: 100%; box-sizing: border-box; margin: 8px 0 10px 0; padding: 7px 14px; border: 1px solid #c7d2fe; border-radius: 6px; background-color: #eff6ff; font-size: 11px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div><span style="color: #666;">{{t.bank}}:</span> <strong>{{bank_name}}</strong></div>
        <div><span style="color: #666;">{{t.account_no}}:</span> <strong>{{bank_account_no}}</strong></div>
        <div><span style="color: #666;">{{t.account_name}}:</span> <strong>{{account_name}}</strong>{{payee_role_badge}}</div>
        <div><span style="color: #666;">{{t.payment_method}}:</span> <strong>{{payment_method}}</strong></div>
      </div>
    </div>

    <!-- Transfer Slip (conditional) -->
    {{slip_html}}
  </div>

  <div style="margin-top: auto; padding-top: 10px; page-break-inside: avoid;">
    <!-- Terms -->
    <div style="font-size: 10px; color: #666; line-height: 1.35; margin-bottom: 10px; padding: 6px 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid;">
      <strong style="color: #4338ca;">{{t.terms_conditions || 'Payment Terms'}}:</strong>
      <div style="margin-top: 2px;">
        1. {{t.terms_payment_transfer || 'Payment Method: Transfer (Please keep the transfer slip)'}}<br>
        2. {{terms_sign_by || 'Please complete payment by'}} <strong>{{contract_due_date || date.today}}</strong>
      </div>
    </div>

    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; page-break-inside: avoid;">
      <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
        <div style="border-bottom: 1px solid #333; width: 100%; height: 22px; margin-bottom: 4px;"></div>
        <div style="font-size: 10px;">{{t.customer_signature}}</div>
      </div>
      <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
        <img src="{{config.logo}}" alt="Logo Stamp" style="height: 38px; margin-bottom: 3px; object-fit: contain;">
        <div style="font-size: 9px; color: #888;">{{config.company}}</div>
      </div>
      <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center;">
        <div style="border-bottom: 1px solid #333; width: 100%; height: 22px; margin-bottom: 4px;"></div>
        <div style="font-size: 10px;">{{t.authorized_signature}}</div>
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
