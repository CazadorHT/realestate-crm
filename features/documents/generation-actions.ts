"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";
import {
  replacePlaceholders,
  formatCurrency,
  formatDate,
  getTranslations,
  localizeObject,
  amountToThaiWords,
  amountToEnglishWords,
} from "./template-engine";
import { createDocumentRecordAction } from "./actions";
import { revalidatePath } from "next/cache";
import { siteConfig } from "@/lib/site-config";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { decrypt } from "@/lib/crypto";
import { getLeadByIdQuery } from "@/features/leads/queries";
// @ts-ignore
import Docxtemplater from "docxtemplater";
import { z } from "zod";
import { mapDbError } from "@/lib/db-error";

/** Generate a short, human-readable document number based on template type */
function generateDocumentNumber(templateType: string, ownerId: string): string {
  const prefixMap: Record<string, string> = {
    RESERVATION_DOCUMENT: "BK",
    SALE_CONTRACT: "SC",
    LEASE_CONTRACT: "LC",
    RENT_RECEIPT: "RC",
  };
  const prefix = prefixMap[templateType] || "DOC";
  // Take 6 chars from owner ID (remove dashes) for uniqueness
  const shortId = ownerId.replace(/-/g, "").substring(0, 6).toUpperCase();
  const ts = Date.now().toString(36).slice(-3).toUpperCase();
  return `${prefix}-${shortId}${ts}`;
}

// Schema for document additional data (shared overrides)
const additionalDataSchema = z
  .object({
    language: z.enum(["th", "en", "cn", "ru"]).optional().default("th"),
    client_name_override: z.string().optional(),
    client_email_override: z.string().email().optional().or(z.literal("")),
    client_line_override: z.string().optional(),
    client_whatsapp_override: z.string().optional(),
    client_wechat_override: z.string().optional(),
    payment_period: z.string().optional(),
    payment_method: z.string().optional(),
    account_name: z.string().optional(),
    slip_url: z.string().optional(),
    reservation_fee: z.string().optional(),
    booking_amount: z.string().optional(),
    security_deposit: z.string().optional(),
    contract_due_date: z.string().optional(),
    client_passport: z.string().optional(),
    client_id_card: z.string().optional(),
    client_nationality: z.string().optional(),
    unit_number_override: z.string().optional(),
    floor_override: z.string().optional(),
    vat_rate: z.string().optional(),
    withholding_tax_rate: z.string().optional(),
    tax_calculation_method: z.enum(["none", "include", "exclude"]).optional().default("none"),
  })
  .passthrough();

/**
 * Convert an image URL or Storage path to a Base64 Data URL.
 * Supports: Local paths (/images/...), Storage paths (slips/...), and full URLs.
 */
async function getImageBase64(
  imageUrl: string,
  supabase?: ReturnType<typeof createClient> extends Promise<infer T>
    ? T
    : never,
): Promise<string> {
  if (!imageUrl) return "";

  try {
    // 1. If it's already a Data URL
    if (imageUrl.startsWith("data:")) return imageUrl;

    // 2. If it's a Supabase storage path (e.g. slips/ownerid/file.jpg)
    if (
      imageUrl.includes("/") &&
      !imageUrl.startsWith("/") &&
      !imageUrl.startsWith("http")
    ) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = createAdminClient();
      const { data, error } = await adminClient.storage
        .from("documents")
        .download(imageUrl);
      if (error || !data) {
        console.error("Storage download error:", error);
        return "";
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      const mimeType = data.type || "image/jpeg";
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    // 3. If it's a local filesystem path (e.g. /images/logo.svg)
    if (imageUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(imageUrl).toLowerCase().replace(".", "");
        const mimeType = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    }

    // 4. If it's a full URL
    if (imageUrl.startsWith("http")) {
      const res = await fetch(imageUrl, {
        next: { revalidate: 31536000 }, // 1 year cache for document image assets
      });
      if (!res.ok) return imageUrl;
      const blob = await res.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      return `data:${blob.type};base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.error("getImageBase64 error:", err);
  }

  return imageUrl;
}

export async function generateDocumentFromTemplateAction(
  templateId: string,
  ownerId: string,
  ownerType: "LEAD" | "PROPERTY" | "DEAL" | "RENTAL_CONTRACT",
  additionalData: z.input<typeof additionalDataSchema> = { language: "th" },
) {
  try {
    // Validate UUIDs
    if (!z.string().uuid().safeParse(templateId).success)
      throw new Error("ID เทมเพลตไม่ถูกต้อง");
    if (!z.string().uuid().safeParse(ownerId).success)
      throw new Error("ID ข้อมูลเจ้าของไม่ถูกต้อง");

    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    let ownerTenantId: string | null = null;

    // 1. Fetch Template
    const { data: template, error: tError } = await supabase
      .from("contract_templates")
      .select("id, name, type, content, is_active")
      .eq("id", templateId)
      .single();

    if (tError) throw new Error(mapDbError(tError));
    if (!template) throw new Error("ไม่พบข้อมูลเทมเพลต");

    // 2. Fetch Owner Data (Lead, Property, Deal)
    const validData = additionalDataSchema.parse(additionalData);
    const lang = (validData.language === "th" || validData.language === "en" || validData.language === "cn" || validData.language === "ru")
      ? validData.language
      : "th";
    const translations = await getTranslations(lang);

    // Base64 process for config images (Logo, Signature, Stamp)
    const config = { ...siteConfig };

    // Process config images in parallel
    const [logoB64, signatureB64, stampB64] = await Promise.all([
      getImageBase64(config.logo),
      getImageBase64(config.companySignature),
      getImageBase64(config.companyStamp),
    ]);

    config.logo = logoB64;
    config.companySignature = signatureB64;
    config.companyStamp = stampB64;

    let contextData: Record<string, any> = {
      date: {
        today: formatDate(new Date(), lang),
      },
      config: config,
      t: translations,
      lang: lang,
    };

    if (ownerType === "LEAD") {
      const { data: leadData, error: lError } = await supabase
        .from("crm_leads_v3")
        .select(`
          id,
          tenant_id,
          identity:identities_v3!crm_leads_v3_identity_id_fkey(
            display_name,
            email,
            phone,
            line_id
          )
        `)
        .eq("id", ownerId)
        .single();
      if (lError) throw new Error(mapDbError(lError));
      if (!leadData) throw new Error("ไม่พบข้อมูลลีดที่ระบุ");
      ownerTenantId = leadData.tenant_id;
      const lead = {
        id: leadData.id,
        tenant_id: leadData.tenant_id,
        full_name: decrypt((leadData.identity as any)?.display_name) || "",
        email: decrypt((leadData.identity as any)?.email) || "",
        phone: decrypt((leadData.identity as any)?.phone) || "",
        line_id: (leadData.identity as any)?.line_id || ""
      };
      contextData.lead = localizeObject(lead, lang);
    } else if (ownerType === "PROPERTY") {
      const { data: property, error: pError } = await supabase
        .from("properties")
        .select(`
          id, title, title_en, title_cn, title_ru, price, original_price, rental_price, original_rental_price, tenant_id, floor,
          bedrooms, bathrooms, size_sqm,
          project_id,
          project:project_id(id, name)
        `)
        .eq("id", ownerId)
        .single();
      if (pError) throw new Error(mapDbError(pError));
      if (!property) throw new Error("ไม่พบข้อมูลทรัพย์สินที่ระบุ");
      ownerTenantId = property.tenant_id;
      contextData.property = localizeObject(property, lang);
      if (property.project) {
        const rawProj = property.project as any;
        const nameVal = rawProj.name ? (rawProj.name[lang] || rawProj.name.en || rawProj.name.th || "") : "";
        contextData.project = { name: nameVal };
      }
    } else if (ownerType === "DEAL") {
      const { data: dealData, error: dError } = await supabase
        .from("crm_deals_v3")
        .select(`
          id,
          deal_type,
          transaction_date,
          tenant_id,
          lead:crm_leads_v3(
            id,
            identity:identities_v3!crm_leads_v3_identity_id_fkey(
              display_name,
              email,
              phone,
              line_id
            )
          ),
          property:properties!crm_deals_v3_property_id_fkey(
            id,
            title,
            title_en,
            title_cn,
            title_ru,
            price,
            rental_price,
            floor,
            bedrooms,
            bathrooms,
            size_sqm,
            project_id,
            project:project_id(id, name)
          )
        `)
        .eq("id", ownerId)
        .single();
      if (dError) throw new Error(mapDbError(dError));
      if (!dealData) throw new Error("ไม่พบข้อมูลดีลที่ระบุ");
      ownerTenantId = dealData.tenant_id;

      const propRaw = dealData.property as any;

      const deal = {
        id: dealData.id,
        deal_type: dealData.deal_type,
        transaction_date: dealData.transaction_date,
        tenant_id: dealData.tenant_id,
        lead: dealData.lead ? {
          id: (dealData.lead as any).id,
          full_name: decrypt((dealData.lead as any).identity?.display_name) || "",
          email: decrypt((dealData.lead as any).identity?.email) || "",
          phone: decrypt((dealData.lead as any).identity?.phone) || "",
          line_id: (dealData.lead as any).identity?.line_id || ""
        } : null,
        property: propRaw ? {
          id: propRaw.id,
          title: propRaw.title || "",
          title_en: propRaw.title_en || propRaw.title || "",
          title_cn: propRaw.title_cn || propRaw.title || "",
          title_ru: propRaw.title_ru || propRaw.title || "",
          price: propRaw.price,
          rental_price: propRaw.rental_price,
          original_price: propRaw.price,
          original_rental_price: propRaw.rental_price,
          floor: propRaw.floor,
          bedrooms: propRaw.bedrooms,
          bathrooms: propRaw.bathrooms,
          size_sqm: propRaw.size_sqm,
          project: propRaw.project ? propRaw.project : null
        } : null
      };

      contextData.deal = localizeObject(deal, lang);
      contextData.lead = localizeObject(deal.lead, lang);
      contextData.property = localizeObject(deal.property, lang);
      if (deal.property && deal.property.project) {
        const rawProj = deal.property.project as any;
        const nameVal = rawProj.name ? (rawProj.name[lang] || rawProj.name.en || rawProj.name.th || "") : "";
        contextData.project = { name: nameVal };
      }

      // Add formatted values based on deal type
      if (deal && contextData.property) {
        const isRent = deal.deal_type === "RENT";
        let price = isRent
          ? contextData.property.rental_price
          : contextData.property.price;

        if (validData.booking_amount) {
          const overridePrice = parseFloat(validData.booking_amount.replace(/,/g, ""));
          if (!isNaN(overridePrice)) {
            price = overridePrice;
          }
        }

        contextData.deal.formatted_price = formatCurrency(price);
        contextData.deal.price = price;

        // Add amount in words
        contextData.deal.amount_in_words =
          lang === "th"
            ? amountToThaiWords(price)
            : amountToEnglishWords(price);

        // Ensure payment_period has a fallback (e.g. from transaction date)
        contextData.deal.payment_period =
          validData.payment_period || formatDate(deal.transaction_date, lang);

        // Try to fetch rental contract if it exists for more details
        if (isRent) {
          const { data: contract } = await supabase
            .from("rental_contracts")
            .select("id, deposit_amount, advance_payment_amount, lease_term_months, start_date")
            .eq("deal_id", ownerId)
            .maybeSingle();

          if (contract) {
            contextData.contract = contract;
            contextData.deal.deposit_amount = formatCurrency(
              contract.deposit_amount,
            );
            contextData.deal.advance_payment_amount = formatCurrency(
              contract.advance_payment_amount,
            );
            contextData.deal.lease_term = contract.lease_term_months;
            contextData.deal.start_date = formatDate(contract.start_date, lang);
          }
        }
      }

      // Allow templates to use deal.reservation_fee or deal.booking_amount
      const rawResFee = validData.reservation_fee || "";
      const resFeeNum = parseFloat(rawResFee.replace(/,/g, "")) || 0;
      contextData.deal.reservation_fee = resFeeNum > 0 ? formatCurrency(resFeeNum) : "";
      contextData.deal.reservation_fee_words = resFeeNum > 0
        ? (lang === "th" ? amountToThaiWords(resFeeNum) : amountToEnglishWords(resFeeNum))
        : "";
      contextData.deal.booking_amount = validData.booking_amount || "";
      contextData.deal.contract_due_date = validData.contract_due_date || "";
      
      const rawSecDep = validData.security_deposit || "";
      const secDepNum = parseFloat(rawSecDep.replace(/,/g, "")) || 0;
      contextData.deal.security_deposit = secDepNum > 0 ? formatCurrency(secDepNum) : "";
      contextData.deal.security_deposit_words = secDepNum > 0
        ? (lang === "th" ? amountToThaiWords(secDepNum) : amountToEnglishWords(secDepNum))
        : "";
    } else if (ownerType === "RENTAL_CONTRACT") {
      const { data: contract, error: cError } = await supabase
        .from("rental_contracts")
        .select("id, tenant_id, contract_number, start_date, end_date, rent_price, deposit_amount")
        .eq("id", ownerId)
        .single();
      if (cError) throw new Error(mapDbError(cError));
      if (!contract) throw new Error("ไม่พบข้อมูลสัญญาเช่าที่ระบุ");
      ownerTenantId = contract.tenant_id;
      contextData.contract = localizeObject(contract, lang);
    }

    // Populate identity info if any nationality, passport or id card are provided
    if (contextData.lead) {
      // Phone fallback
      if (!contextData.lead.phone || contextData.lead.phone.trim() === "") {
        contextData.lead.phone = lang === "th" ? "(ไม่ได้ระบุ)" : "(Not specified)";
      }
      if (!contextData.lead.line_id || contextData.lead.line_id.trim() === "") {
        contextData.lead.line_id = lang === "th" ? "(ไม่ได้ระบุ)" : "(Not specified)";
      }
      let identityInfo = "";
      if (validData.client_id_card) {
        identityInfo += `<br><span style="color: #666;">${lang === "th" ? "เลขบัตรประชาชน" : "ID Card No."}:</span> <span>${validData.client_id_card}</span>`;
      }
      if (validData.client_passport) {
        identityInfo += `<br><span style="color: #666;">${lang === "th" ? "เลขที่พาสปอร์ต" : "Passport No."}:</span> <span>${validData.client_passport}</span>`;
      }
      if (validData.client_nationality) {
        identityInfo += `<br><span style="color: #666;">${lang === "th" ? "สัญชาติ" : "Nationality"}:</span> <span>${validData.client_nationality}</span>`;
      }
      if (validData.client_email_override) {
        identityInfo += `<br><span style="color: #666;">Email:</span> <span>${validData.client_email_override}</span>`;
      }
      contextData.lead.identity_info = identityInfo;
    }

    // Build financial_table_html block — professional table layout with VAT and WHT support
    const rawResFee = validData.reservation_fee || "";
    const resFeeNum = parseFloat(rawResFee.replace(/,/g, "")) || 0;

    const rawSecDep = validData.security_deposit || "";
    const secDepNum = parseFloat(rawSecDep.replace(/,/g, "")) || 0;

    const rawBookingAmt = validData.booking_amount || "";
    const bookingAmtNum = parseFloat(rawBookingAmt.replace(/,/g, "")) || 0;

    const dealPrice = contextData.deal?.price || contextData.property?.rental_price || 0;
    const rentPrice = bookingAmtNum > 0 ? bookingAmtNum : dealPrice;

    // Tax settings
    const vatRate = parseFloat(validData.vat_rate || "") || 0;
    const whtRate = parseFloat(validData.withholding_tax_rate || "") || 0;
    const taxMethod = validData.tax_calculation_method || "none";

    // Determine what items are present
    const isRentReceipt = template.type === "RENT_RECEIPT";
    const hasRent = isRentReceipt && rentPrice > 0;
    const hasReservation = resFeeNum > 0;
    const hasSecurityDeposit = secDepNum > 0;

    // Calculate taxable base (Including Security Deposit in the tax base)
    let taxableBase = 0;
    if (hasRent) taxableBase += rentPrice;
    if (hasReservation) taxableBase += resFeeNum;
    if (hasSecurityDeposit) taxableBase += secDepNum;

    // Calculate tax breakdown
    let grossAmount = taxableBase;
    let vatAmount = 0;
    let whtAmount = 0;
    let netTaxable = taxableBase;

    if (taxMethod === "exclude") {
      grossAmount = taxableBase;
      vatAmount = grossAmount * (vatRate / 100);
      whtAmount = grossAmount * (whtRate / 100);
      netTaxable = grossAmount + vatAmount - whtAmount;
    } else if (taxMethod === "include") {
      // Gross-up calculation: Net = Gross * (1 + V% - W%)
      const divisor = 1 + (vatRate / 100) - (whtRate / 100);
      grossAmount = divisor > 0 ? taxableBase / divisor : taxableBase;
      vatAmount = grossAmount * (vatRate / 100);
      whtAmount = grossAmount * (whtRate / 100);
      netTaxable = taxableBase;
    } else {
      // none
      grossAmount = taxableBase;
      vatAmount = 0;
      whtAmount = 0;
      netTaxable = taxableBase;
    }

    const grandTotal = netTaxable;

    // Scale factors for itemized display if tax is included/excluded
    const scaleFactor = taxableBase > 0 ? (grossAmount / taxableBase) : 1;

    // Format individual row prices reflecting their Gross value
    const displayRentPrice = hasRent ? rentPrice * scaleFactor : 0;
    const displayResFee = hasReservation ? resFeeNum * scaleFactor : 0;
    const displaySecDep = hasSecurityDeposit ? secDepNum * scaleFactor : 0;

    // Determine month labels based on input compared to rental price
    let resFeeMonths = 0;
    let secDepMonths = 0;

    if (dealPrice > 0) {
      const rMonths = Math.round(resFeeNum / dealPrice);
      if (Math.abs(resFeeNum - rMonths * dealPrice) < 2) {
        resFeeMonths = rMonths;
      }
      const sMonths = Math.round(secDepNum / dealPrice);
      if (Math.abs(secDepNum - sMonths * dealPrice) < 2) {
        secDepMonths = sMonths;
      }
    }

    const descLabel = translations.description || (lang === "th" ? "รายการ" : "Description");
    const qtyLabel = translations.quantity || (lang === "th" ? "จำนวน" : "Quantity");
    const unitPriceLabel = translations.unit_price || (lang === "th" ? "ราคาต่อหน่วย" : "Unit Price");
    const totalLabel = translations.total || (lang === "th" ? "ยอดรวม" : "Total");

    const rentLabel = lang === "th"
      ? `ค่าเช่าอสังหาริมทรัพย์ (Rent Payment)${validData.payment_period ? ` สำหรับงวด ${validData.payment_period}` : ""}`
      : `Rental Payment${validData.payment_period ? ` for ${validData.payment_period}` : ""}`;

    const reservationLabel = lang === "th" 
      ? `เงินมัดจำ / ค่าจอง (Reservation Fee)${resFeeMonths > 0 ? ` (${resFeeMonths} เดือน)` : ""}` 
      : `Reservation Fee${resFeeMonths > 0 ? ` (${resFeeMonths} Month${resFeeMonths > 1 ? "s" : ""})` : ""}`;

    const securityLabel = lang === "th" 
      ? `เงินประกัน (Security Deposit)${secDepMonths > 0 ? ` (${secDepMonths} เดือน)` : ""}` 
      : `Security Deposit${secDepMonths > 0 ? ` (${secDepMonths} Month${secDepMonths > 1 ? "s" : ""})` : ""}`;

    const subTotalLabel = lang === "th" ? "ค่าบริการ/ค่าเช่าก่อนภาษี (Gross Amount)" : "Gross Amount";
    const vatLabel = lang === "th" ? `ภาษีมูลค่าเพิ่ม / VAT (${vatRate}%)` : `VAT (${vatRate}%)`;
    const whtLabel = lang === "th" ? `หักภาษี ณ ที่จ่าย / Withholding Tax (${whtRate}%)` : `Withholding Tax (${whtRate}%)`;
    const grandTotalLabel = lang === "th" ? "ยอดโอนสุทธิ / Net Payable" : "Net Payable";

    let rowNum = 0;
    let tableRows = "";

    if (hasRent) {
      rowNum++;
      tableRows += `
        <tr>
          <td style="text-align: center; width: 40px;">${rowNum}</td>
          <td>${rentLabel}</td>
          <td style="text-align: center; width: 70px;">1</td>
          <td style="text-align: right; width: 110px;">${formatCurrency(displayRentPrice)}</td>
          <td style="text-align: right; width: 110px;">${formatCurrency(displayRentPrice)}</td>
        </tr>`;
    }

    if (hasReservation) {
      rowNum++;
      tableRows += `
        <tr>
          <td style="text-align: center; width: 40px;">${rowNum}</td>
          <td>${reservationLabel}</td>
          <td style="text-align: center; width: 70px;">1</td>
          <td style="text-align: right; width: 110px;">${formatCurrency(displayResFee)}</td>
          <td style="text-align: right; width: 110px;">${formatCurrency(displayResFee)}</td>
        </tr>`;
    }

    if (hasSecurityDeposit) {
      rowNum++;
      tableRows += `
        <tr>
          <td style="text-align: center;">${rowNum}</td>
          <td>${securityLabel}</td>
          <td style="text-align: center;">1</td>
          <td style="text-align: right;">${formatCurrency(displaySecDep)}</td>
          <td style="text-align: right;">${formatCurrency(displaySecDep)}</td>
        </tr>`;
    }

    const grandTotalWords = grandTotal > 0
      ? (lang === "th" ? amountToThaiWords(grandTotal) : amountToEnglishWords(grandTotal))
      : "";

    // Set template context variables so they are accessible as normal placeholders in DOCX / HTML templates too
    contextData.deal.gross_amount = formatCurrency(grossAmount);
    contextData.deal.vat_amount = formatCurrency(vatAmount);
    contextData.deal.withholding_tax_amount = formatCurrency(whtAmount);
    contextData.deal.net_transfer_amount = formatCurrency(grandTotal);
    contextData.deal.net_payable = formatCurrency(grandTotal);
    contextData.deal.vat_rate = vatRate;
    contextData.deal.withholding_tax_rate = whtRate;
    contextData.deal.tax_calculation_method = taxMethod;

    let financial_table_html = "";
    if (rowNum > 0) {
      financial_table_html = `
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 40px; color: #475569;">#</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; color: #475569;">${descLabel}</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 70px; color: #475569;">${qtyLabel}</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 110px; color: #475569;">${unitPriceLabel}</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 110px; color: #475569;">${totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          
          ${taxMethod !== "none" && taxableBase > 0 ? `
          <tr style="background-color: #f8fafc;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: bold; color: #475569;">${subTotalLabel}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; color: #1e293b;">${formatCurrency(grossAmount)}</td>
          </tr>
          ` : ""}

          ${vatRate > 0 && taxMethod !== "none" ? `
          <tr style="background-color: #f8fafc;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: bold; color: #475569;">${vatLabel}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; color: #1e293b;">+ ${formatCurrency(vatAmount)}</td>
          </tr>
          ` : ""}

          ${whtRate > 0 && taxMethod !== "none" ? `
          <tr style="background-color: #f8fafc;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: bold; color: #b91c1c;">${whtLabel}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; color: #b91c1c; font-weight: bold;">- ${formatCurrency(whtAmount)}</td>
          </tr>
          ` : ""}

          <tr style="background-color: #f1f5f9;">
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #1e293b;">${grandTotalLabel}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; font-size: 14px; color: #0c4a6e;">${formatCurrency(grandTotal)} THB</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size: 11px; font-style: italic; color: #64748b; text-align: right; margin-top: -8px; margin-bottom: 10px;">( ${grandTotalWords} )</div>
      `;
    }
     contextData.financial_info_html = financial_table_html;
    contextData.financial_table_html = financial_table_html;

    // Merge additional data (properly sanitized by Zod)
    contextData = { ...contextData, ...validData };

    if (contextData.property && contextData.property.id) {
      const fullId = contextData.property.id;
      const shortId = fullId.includes("-") ? fullId.split("-")[0] : fullId;
      contextData.property.id = shortId;
      contextData.property.property_code = `RES-${shortId}`;
      contextData.property.short_id = shortId;
      if (validData.unit_number_override) {
        contextData.property.unit_number = validData.unit_number_override;
        contextData.property.unit = validData.unit_number_override;
      }
      if (validData.floor_override) {
        contextData.property.floor = validData.floor_override;
      }
    }

    // Final Image Processing (e.g. Slip) - Convert to Base64
    if (contextData.slip_url) {
      contextData.slip_url = await getImageBase64(
        contextData.slip_url,
        supabase,
      );
    }

    // Fix: Ensure slip_url is available consistently across all owner types
    if (!contextData.deal) contextData.deal = {};
    if (contextData.slip_url) contextData.deal.slip_url = contextData.slip_url;

    // Build slip_html — only show if slip_url exists
    const slipLabel = lang === "th" ? "หลักฐานการโอนเงิน" : "Payment Record (Transfer)";
    if (contextData.slip_url && contextData.slip_url.startsWith("data:")) {
      contextData.slip_html = `
      <div style="text-align: center; margin: 10px 0; page-break-inside: avoid;">
        <p style="font-size: 11px; color: #666; margin-bottom: 5px;">${slipLabel}</p>
        <img src="${contextData.slip_url}" style="max-height: 80mm; max-width: 100mm; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2px; object-fit: contain;" alt="Transfer Slip">
      </div>`;
    } else {
      contextData.slip_html = "";
    }

    // Apply Overrides
    if (validData.client_name_override && contextData.lead) {
      contextData.lead.full_name = validData.client_name_override;
    }
    if (validData.client_email_override && contextData.lead) {
      contextData.lead.email = validData.client_email_override;
    }
    if (validData.client_line_override && contextData.lead) {
      contextData.lead.line_id = validData.client_line_override;
    }
    if (validData.client_whatsapp_override && contextData.lead) {
      contextData.lead.whatsapp = validData.client_whatsapp_override;
    }
    if (validData.client_wechat_override && contextData.lead) {
      contextData.lead.wechat_id = validData.client_wechat_override;
    }

    contextData.payment_period =
      validData.payment_period || contextData.deal?.payment_period || "";
    contextData.payment_method = validData.payment_method || "Transfer";
    contextData.account_name = validData.account_name || "";
    contextData.bank_account_name = validData.account_name || "";

    if (contextData.lead) {
      if (validData.client_passport) contextData.lead.passport = validData.client_passport;
      if (validData.client_id_card) contextData.lead.id_card = validData.client_id_card;
      if (validData.client_nationality) contextData.lead.nationality = validData.client_nationality;
    }
    contextData.client_passport = validData.client_passport || "";
    contextData.client_id_card = validData.client_id_card || "";
    contextData.client_nationality = validData.client_nationality || "";

    // Add translation terms from locale — use translations from locale files only
    contextData.terms_deposit = translations.terms_deposit || "Reservation deposit part of contract fee.";
    contextData.terms_sign_by = translations.terms_sign_by || "Sign contract by:";
    contextData.terms_payment_transfer = translations.terms_payment_transfer || "Payment Method: Transfer (Please keep the transfer slip)";

    // Generate document number based on template type
    contextData.document_number = generateDocumentNumber(template.type, ownerId);

    // Check for critical missing data
    if (ownerType === "DEAL" && (!contextData.lead || !contextData.property)) {
      throw new Error("ข้อมูลดีลไม่สมบูรณ์ (ขาดข้อมูลลูกค้าหรือทรัพย์สิน)");
    }

    // 3. Replace Placeholders
    if (!template.content || template.content.trim() === "") {
      throw new Error("ต้นแบบสัญญาไม่มีเนื้อหา (Template content is empty)");
    }
    const generatedContent = replacePlaceholders(template.content, contextData);

    // 4. Save as Document Record
    const timestamp = new Date().getTime();
    const safeTemplateName = template.name.replace(/[^a-zA-Z0-9ก-๙]/g, "_");
    const displayFileName = `${safeTemplateName}_${timestamp}.html`;

    // Use an ASCII-safe string for Supabase storage key to avoid "Invalid key" errors
    const storageFileName = `generated_${template.type.toLowerCase()}_${timestamp}.html`;
    const finalTenantId = ownerTenantId || tenantId;
    const storagePath =
      finalTenantId && finalTenantId !== "ALL"
        ? `${finalTenantId}/generated/${ownerType}/${ownerId}/${storageFileName}`
        : `generated/${ownerType}/${ownerId}/${storageFileName}`;

    // Add UTF-8 meta tag and print styles for A4
    const finalHtmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
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

  /* A4 Page Setup - Automatic Scaling */
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
  
  /* Ensure images fit within the page */
  img { max-width: 100%; height: auto; }

  .slip-container {
    text-align: center;
    margin: 10px 0;
    page-break-inside: avoid;
    flex-grow: 0;
    flex-shrink: 1;
    min-height: 0;
  }
  
  .slip-image {
    max-height: 80mm; /* Reduced size to fit better with text */
    max-width: 100mm;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 2px;
    object-fit: contain;
  }

  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
  th, td { border: 1px solid var(--border-color); padding: 6px 10px; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; }
  
  /* Helper for "auto" text scaling if it's too much content */
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="content-wrapper">
      ${generatedContent}
    </div>
  </div>
</body>
</html>
    `.trim();

    // Upload generated HTML to storage
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(finalHtmlContent);

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, uint8Array, {
        contentType: "text/html",
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError)
      throw new Error(`ไม่สามารถอัปโหลดไฟล์ได้: ${mapDbError(uploadError)} `);

    // 5. Create Document Metadata
    const docRes = await createDocumentRecordAction({
      owner_id: ownerId,
      owner_type: ownerType,
      document_type: template.type as any,
      file_name: displayFileName,
      storage_path: storagePath,
      mime_type: "text/html",
      size_bytes: uint8Array.byteLength,
      version: 1,
      tenant_id: ownerTenantId,
    });

    if (!docRes.success)
      throw new Error(docRes.message || "บันทึกข้อมูลเข้าฐานข้อมูลไม่สำเร็จ");

    revalidatePath("/protected/documents");
    return { success: true, data: docRes.data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError)
      return {
        success: false,
        message: "ข้อมูลนำเข้าไม่ถูกต้อง: " + error.issues[0].message,
      };
    console.error("Document Generation Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการสร้างเอกสาร",
    };
  }
}

export async function generateDocxDocumentFromTemplateAction(
  ownerId: string,
  ownerType: "LEAD" | "PROPERTY" | "DEAL" | "RENTAL_CONTRACT",
  docxStoragePath: string,
  additionalData: z.input<typeof additionalDataSchema> = { language: "th" },
  options?: { templateName?: string },
) {
  try {
    // Validate Input
    if (!z.string().uuid().safeParse(ownerId).success)
      throw new Error("ID ข้อมูลเจ้าของไม่ถูกต้อง");
    const validData = additionalDataSchema.parse(additionalData);

    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    let ownerTenantId: string | null = null;

    // 1. Fetch the DOCX template from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("documents")
      .download(docxStoragePath);

    if (fileError)
      throw new Error(`ไม่สามารถโหลดเทมเพลตได้: ${mapDbError(fileError)}`);
    if (!fileData) throw new Error("ไม่พบไฟล์เทมเพลต");

    const templateBuffer = Buffer.from(await fileData.arrayBuffer());

    // 2. Prepare Context (similar to generateDocumentFromTemplateAction)
    const lang = (validData.language === "th" || validData.language === "en" || validData.language === "cn" || validData.language === "ru")
      ? validData.language
      : "th";
    const translations = await getTranslations(lang);

    let contextData: Record<string, any> = {
      date: { today: formatDate(new Date(), lang) },
      config: siteConfig,
      t: translations,
      lang: lang,
    };

    if (ownerType === "LEAD") {
      const { data: leadData, error: lError } = await supabase
        .from("crm_leads_v3")
        .select(`
          id,
          tenant_id,
          identity:identities_v3!crm_leads_v3_identity_id_fkey(
            display_name,
            email,
            phone,
            line_id
          )
        `)
        .eq("id", ownerId)
        .single();
      if (lError) throw new Error(mapDbError(lError));
      if (!leadData) throw new Error("ไม่พบข้อมูลลีดที่ระบุ");
      ownerTenantId = leadData.tenant_id;
      const lead = {
        id: leadData.id,
        tenant_id: leadData.tenant_id,
        full_name: decrypt((leadData.identity as any)?.display_name) || "",
        email: decrypt((leadData.identity as any)?.email) || "",
        phone: decrypt((leadData.identity as any)?.phone) || "",
        line_id: (leadData.identity as any)?.line_id || ""
      };
      contextData.lead = localizeObject(lead, lang);
    } else if (ownerType === "PROPERTY") {
      const { data: property, error: pError } = await supabase
        .from("properties")
        .select("id, title, title_en, title_cn, title_ru, price, original_price, rental_price, original_rental_price, tenant_id")
        .eq("id", ownerId)
        .single();
      if (pError) throw new Error(mapDbError(pError));
      if (!property) throw new Error("ไม่พบข้อมูลทรัพย์สินที่ระบุ");
      ownerTenantId = property.tenant_id;
      contextData.property = localizeObject(property, lang);
    } else if (ownerType === "DEAL") {
      const { data: dealData, error: dError } = await supabase
        .from("crm_deals_v3")
        .select(`
          id,
          deal_type,
          transaction_date,
          tenant_id,
          lead:crm_leads_v3(
            id,
            identity:identities_v3!crm_leads_v3_identity_id_fkey(
              display_name,
              email,
              phone,
              line_id
            )
          ),
          property:properties!crm_deals_v3_property_id_fkey(
            id,
            title,
            title_en,
            title_cn,
            title_ru,
            price,
            rental_price
          )
        `)
        .eq("id", ownerId)
        .single();
      if (dError) throw new Error(mapDbError(dError));
      if (!dealData) throw new Error("ไม่พบข้อมูลดีลที่ระบุ");
      ownerTenantId = dealData.tenant_id;

      const propRaw = dealData.property as any;

      const deal = {
        id: dealData.id,
        deal_type: dealData.deal_type,
        transaction_date: dealData.transaction_date,
        tenant_id: dealData.tenant_id,
        lead: dealData.lead ? {
          id: (dealData.lead as any).id,
          full_name: decrypt((dealData.lead as any).identity?.display_name) || "",
          email: decrypt((dealData.lead as any).identity?.email) || "",
          phone: decrypt((dealData.lead as any).identity?.phone) || "",
          line_id: (dealData.lead as any).identity?.line_id || ""
        } : null,
        property: propRaw ? {
          id: propRaw.id,
          title: propRaw.title || "",
          title_en: propRaw.title_en || propRaw.title || "",
          title_cn: propRaw.title_cn || propRaw.title || "",
          title_ru: propRaw.title_ru || propRaw.title || "",
          price: propRaw.price,
          rental_price: propRaw.rental_price,
          original_price: propRaw.price,
          original_rental_price: propRaw.rental_price
        } : null
      };

      contextData.deal = localizeObject(deal, lang);
      contextData.lead = localizeObject(deal.lead, lang);
      contextData.property = localizeObject(deal.property, lang);

      if (deal && contextData.property) {
        const isRent = deal.deal_type === "RENT";
        let price = isRent
          ? contextData.property.rental_price
          : contextData.property.price;

        if (validData.booking_amount) {
          const overridePrice = parseFloat(validData.booking_amount.replace(/,/g, ""));
          if (!isNaN(overridePrice)) {
            price = overridePrice;
          }
        }

        contextData.deal.formatted_price = formatCurrency(price);
        contextData.deal.price = price;
        contextData.deal.amount_in_words =
          lang === "th"
            ? amountToThaiWords(price)
            : amountToEnglishWords(price);
        contextData.deal.payment_period =
          validData.payment_period || formatDate(deal.transaction_date, lang);

        if (isRent) {
          const { data: contract } = await supabase
            .from("rental_contracts")
            .select("id, deposit_amount, advance_payment_amount, lease_term_months, start_date")
            .eq("deal_id", ownerId)
            .maybeSingle();
          if (contract) {
            contextData.contract = contract;
            contextData.deal.deposit_amount = formatCurrency(
              contract.deposit_amount,
            );
            contextData.deal.advance_payment_amount = formatCurrency(
              contract.advance_payment_amount,
            );
            contextData.deal.lease_term = contract.lease_term_months;
            contextData.deal.start_date = formatDate(contract.start_date, lang);
          }
        }
      }
      
      const rawResFee = validData.reservation_fee || "";
      const resFeeNum = parseFloat(rawResFee.replace(/,/g, "")) || 0;
      contextData.deal.reservation_fee = resFeeNum > 0 ? formatCurrency(resFeeNum) : "";
      contextData.deal.reservation_fee_words = resFeeNum > 0
        ? (lang === "th" ? amountToThaiWords(resFeeNum) : amountToEnglishWords(resFeeNum))
        : "";
      contextData.deal.booking_amount = validData.booking_amount || "";
      contextData.deal.contract_due_date = validData.contract_due_date || "";
      
      const rawSecDep = validData.security_deposit || "";
      const secDepNum = parseFloat(rawSecDep.replace(/,/g, "")) || 0;
      contextData.deal.security_deposit = secDepNum > 0 ? formatCurrency(secDepNum) : "";
      contextData.deal.security_deposit_words = secDepNum > 0
        ? (lang === "th" ? amountToThaiWords(secDepNum) : amountToEnglishWords(secDepNum))
        : "";

      // Calculate tax details for DOCX templates
      const vatRate = parseFloat(validData.vat_rate || "") || 0;
      const whtRate = parseFloat(validData.withholding_tax_rate || "") || 0;
      const taxMethod = validData.tax_calculation_method || "none";

      const isRent = contextData.deal?.deal_type === "RENT";
      const rentPrice = isRent ? (parseFloat(validData.booking_amount?.replace(/,/g, "") || "") || parseFloat(contextData.deal?.price || "") || 0) : 0;
      
      let taxableBase = 0;
      if (rentPrice > 0) taxableBase += rentPrice;
      if (resFeeNum > 0) taxableBase += resFeeNum;

      let grossAmount = taxableBase;
      let vatAmount = 0;
      let whtAmount = 0;
      let netTaxable = taxableBase;

      if (taxMethod === "exclude") {
        grossAmount = taxableBase;
        vatAmount = grossAmount * (vatRate / 100);
        whtAmount = grossAmount * (whtRate / 100);
        netTaxable = grossAmount + vatAmount - whtAmount;
      } else if (taxMethod === "include") {
        const divisor = 1 + (vatRate / 100) - (whtRate / 100);
        grossAmount = divisor > 0 ? taxableBase / divisor : taxableBase;
        vatAmount = grossAmount * (vatRate / 100);
        whtAmount = grossAmount * (whtRate / 100);
        netTaxable = taxableBase;
      }

      const grandTotal = netTaxable + secDepNum;

      contextData.deal.gross_amount = formatCurrency(grossAmount);
      contextData.deal.vat_amount = formatCurrency(vatAmount);
      contextData.deal.withholding_tax_amount = formatCurrency(whtAmount);
      contextData.deal.net_transfer_amount = formatCurrency(grandTotal);
      contextData.deal.net_payable = formatCurrency(grandTotal);
      contextData.deal.vat_rate = vatRate;
      contextData.deal.withholding_tax_rate = whtRate;
      contextData.deal.tax_calculation_method = taxMethod;
    } else if (ownerType === "RENTAL_CONTRACT") {
      const { data: contract, error: cError } = await supabase
        .from("rental_contracts")
        .select("id, tenant_id, contract_number, start_date, end_date, rent_price, deposit_amount")
        .eq("id", ownerId)
        .single();
      if (cError) throw new Error(mapDbError(cError));
      if (!contract) throw new Error("ไม่พบข้อมูลสัญญาเช่าที่ระบุ");
      ownerTenantId = contract.tenant_id;
      contextData.contract = localizeObject(contract, lang);
    }

    // Merge additional data (properly sanitized)
    contextData = { ...contextData, ...validData };

    if (contextData.property && contextData.property.id) {
      const fullId = contextData.property.id;
      const shortId = fullId.includes("-") ? fullId.split("-")[0] : fullId;
      contextData.property.id = shortId;
      contextData.property.property_code = `RES-${shortId}`;
      contextData.property.short_id = shortId;
    }

    if (validData.client_name_override && contextData.lead) {
      contextData.lead.full_name = validData.client_name_override;
    }
    if (validData.client_email_override && contextData.lead) {
      contextData.lead.email = validData.client_email_override;
    }
    if (validData.client_line_override && contextData.lead) {
      contextData.lead.line_id = validData.client_line_override;
    }
    if (validData.client_whatsapp_override && contextData.lead) {
      contextData.lead.whatsapp = validData.client_whatsapp_override;
    }
    if (validData.client_wechat_override && contextData.lead) {
      contextData.lead.wechat_id = validData.client_wechat_override;
    }

    contextData.payment_period =
      validData.payment_period || contextData.deal?.payment_period || "";
    contextData.payment_method = validData.payment_method || "Transfer";
    contextData.account_name = validData.account_name || "";
    contextData.bank_account_name = validData.account_name || "";

    if (contextData.lead) {
      if (validData.client_passport) contextData.lead.passport = validData.client_passport;
      if (validData.client_id_card) contextData.lead.id_card = validData.client_id_card;
      if (validData.client_nationality) contextData.lead.nationality = validData.client_nationality;
    }
    contextData.client_passport = validData.client_passport || "";
    contextData.client_id_card = validData.client_id_card || "";
    contextData.client_nationality = validData.client_nationality || "";

    // Add translation terms from locale — use translations from locale files only
    contextData.terms_deposit = translations.terms_deposit || "Reservation deposit part of contract fee.";
    contextData.terms_sign_by = translations.terms_sign_by || "Sign contract by:";
    contextData.terms_payment_transfer = translations.terms_payment_transfer || "Payment Method: Transfer (Please keep the transfer slip)";

    // 3. Process the DOCX with docxtemplater
    let zip;
    try {
      zip = new PizZip(templateBuffer);
    } catch (e) {
      throw new Error("ไฟล์ DOCX ไม่ถูกต้อง หรืออาจจะเสียหาย");
    }

    let doc;
    try {
      doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render(contextData);
    } catch (error: unknown) {
      console.error("Docxtemplater parsing error:", error);
      let errorMsg = "รูปแบบตัวแปร(Tag) ในไฟล์ DOCX ไม่ถูกต้อง";
      const err = error as {
        properties?: {
          errors?: {
            properties?: { explanation?: string };
            message?: string;
          }[];
        };
      };
      if (err.properties && err.properties.errors instanceof Array) {
        const errorDetails = err.properties.errors
          .map((e) => e.properties?.explanation || e.message)
          .join(", ");
        errorMsg += ` รายละเอียด: ${errorDetails}`;
      }
      throw new Error(errorMsg);
    }

    const buf = doc
      .getZip()
      .generate({ type: "nodebuffer", compression: "DEFLATE" });

    // 4. Save to Storage
    const timestamp = new Date().getTime();
    const safeTemplateName = (
      options?.templateName || "custom_contract"
    ).replace(/[^a-zA-Z0-9ก-๙]/g, "_");
    const displayFileName = `${safeTemplateName}_${timestamp}.docx`;
    const storageFileName = `generated_${timestamp}.docx`;
    const finalTenantId = ownerTenantId || tenantId;
    const finalStoragePath =
      finalTenantId && finalTenantId !== "ALL"
        ? `${finalTenantId}/generated/${ownerType}/${ownerId}/${storageFileName}`
        : `generated/${ownerType}/${ownerId}/${storageFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(finalStoragePath, buf, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError)
      throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${mapDbError(uploadError)}`);

    // 5. Create DB Record
    const docRes = await createDocumentRecordAction({
      owner_id: ownerId,
      owner_type: ownerType,
      document_type: "OTHER",
      file_name: displayFileName,
      storage_path: finalStoragePath,
      mime_type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size_bytes: buf.length,
      version: 1,
      tenant_id: ownerTenantId,
    });

    if (!docRes.success)
      throw new Error(docRes.message || "บันทึกข้อมูลเข้าฐานข้อมูลไม่สำเร็จ");

    revalidatePath("/protected/documents");
    return { success: true, data: docRes.data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError)
      return {
        success: false,
        message: "ข้อมูลนำเข้าไม่ถูกต้อง: " + error.issues[0].message,
      };
    console.error("DOCX Generation Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX",
    };
  }
}

export async function getDealDetailsAction(dealId: string) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { data: dealData, error: dError } = await supabase
      .from("crm_deals_v3")
      .select(`
        id,
        deal_type,
        transaction_date,
        lead:crm_leads_v3(
          id,
          utm_data,
          identity:identities_v3!crm_leads_v3_identity_id_fkey(
            display_name,
            email,
            phone,
            line_id,
            social_links
          )
        ),
        property:properties!crm_deals_v3_property_id_fkey(
          id,
          floor,
          bedrooms,
          bathrooms,
          size_sqm
        )
      `)
      .eq("id", dealId)
      .single();

    if (dError) throw new Error(dError.message);
    if (!dealData) throw new Error("Deal not found");

    const leadRaw = dealData.lead as any;
    const identityRaw = leadRaw?.identity;
    const socialLinks = identityRaw?.social_links || {};
    const utmData = leadRaw?.utm_data as any || {};
    const prefs = utmData.preferences || {};

    return {
      success: true,
      data: {
        id: dealData.id,
        deal_type: dealData.deal_type,
        lead: leadRaw ? {
          id: leadRaw.id,
          full_name: decrypt(identityRaw?.display_name) || "",
          email: decrypt(identityRaw?.email) || "",
          phone: decrypt(identityRaw?.phone) || "",
          line_id: identityRaw?.line_id || "",
          whatsapp: decrypt(socialLinks.whatsapp) || "",
          wechat_id: decrypt(socialLinks.wechat_id) || "",
          nationality: prefs.nationality || "",
          id_card: prefs.id_card || "",
          passport: prefs.passport || ""
        } : null,
        property: dealData.property ? {
          id: (dealData.property as any).id,
          floor: (dealData.property as any).floor || "",
          bedrooms: (dealData.property as any).bedrooms || "",
          bathrooms: (dealData.property as any).bathrooms || "",
          size_sqm: (dealData.property as any).size_sqm || ""
        } : null
      }
    };
  } catch (error) {
    console.error("Error fetching deal details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getLeadDetailsAction(leadId: string) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const lead = await getLeadByIdQuery(leadId);
    if (!lead) throw new Error("Lead not found");

    return {
      success: true,
      data: lead
    };
  } catch (error) {
    console.error("Error fetching lead details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function uploadDocumentToStorageAction(
  formData: FormData,
  filePath: string
) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const buffer = Buffer.from(await file.arrayBuffer());

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: true,
      });

    if (error) {
      console.error("Admin storage upload error:", error);
      throw new Error(error.message);
    }

    return {
      success: true,
      path: data.path
    };
  } catch (error) {
    console.error("uploadDocumentToStorageAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

