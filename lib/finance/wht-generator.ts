import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs/promises";
import path from "path";

// Cache embedded font bytes across function calls in the same execution instance
let cachedKanitBold: Uint8Array | null = null;

export interface WhtData {
  agentName: string;
  agentIdCard?: string;
  address?: string;
  taxAmount: number;
  grossAmount: number;
  date: string;
  tenantName: string;
  tenantTaxId?: string;
  tenantAddress?: string;
}

/**
 * Generates a 50-Tawi (WHT) PDF Certificate using the Kanit font for Thai support.
 */
export async function generateWhtCertificate(data: WhtData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load Thai Font (Kanit-Bold) — cache bytes to avoid repeated disk IO and parsing
  const fontPath = path.join(process.cwd(), "public/fonts/Kanit-Bold.ttf");
  if (!cachedKanitBold) {
    try {
      cachedKanitBold = await fs.readFile(fontPath);
    } catch (e) {
      // Re-throw with context so caller can handle or log appropriately
      throw new Error(`Unable to load Kanit-Bold font at ${fontPath}: ${(e as Error).message}`);
    }
  }
  const thaiFont = await pdfDoc.embedFont(cachedKanitBold as Uint8Array);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  let yOffset = height - 50;

  // 1. Header Section
  page.drawText("หนังสือรับรองการหักภาษี ณ ที่จ่าย", {
    x: width / 2 - 100,
    y: yOffset,
    size: 18,
    font: thaiFont,
    color: rgb(0, 0, 0),
  });
  yOffset -= 25;

  page.drawText("(ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร)", {
    x: width / 2 - 80,
    y: yOffset,
    size: 10,
    font: thaiFont,
  });
  yOffset -= 40;

  // 2. Payor (Tenant/Company) Section
  page.drawRectangle({
    x: 50,
    y: yOffset - 60,
    width: width - 100,
    height: 70,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawText("ผู้มีหน้าที่หักภาษี ณ ที่จ่าย (บริษัท/ผู้จัดการ):", {
    x: 60,
    y: yOffset - 15,
    size: 10,
    font: thaiFont,
  });
  page.drawText(data.tenantName, {
    x: 70,
    y: yOffset - 35,
    size: 12,
    font: thaiFont,
  });
  yOffset -= 80;

  // 3. Payee (Agent) Section
  page.drawRectangle({
    x: 50,
    y: yOffset - 60,
    width: width - 100,
    height: 70,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawText("ผู้ถูกหักภาษี ณ ที่จ่าย (เอเยนต์/นายหน้า):", {
    x: 60,
    y: yOffset - 15,
    size: 10,
    font: thaiFont,
  });
  page.drawText(data.agentName, {
    x: 70,
    y: yOffset - 35,
    size: 12,
    font: thaiFont,
  });
  yOffset -= 80;

  // 4. Payment Details Table
  const tableTop = yOffset;
  page.drawRectangle({
    x: 50,
    y: yOffset - 150,
    width: width - 100,
    height: 150,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Table Headers
  page.drawText("ประเภทเงินได้", { x: 60, y: tableTop - 20, size: 10, font: thaiFont });
  page.drawText("จำนวนเงินที่จ่าย (Gross)", { x: 300, y: tableTop - 20, size: 10, font: thaiFont });
  page.drawText("ภาษีที่หัก (WHT 3%)", { x: 450, y: tableTop - 20, size: 10, font: thaiFont });

  page.drawLine({
    start: { x: 50, y: tableTop - 30 },
    end: { x: width - 50, y: tableTop - 30 },
    thickness: 1,
  });

  // Data Row
  page.drawText("ค่าคอมมิชชั่น / ค่านายหน้า", { x: 60, y: tableTop - 50, size: 11, font: thaiFont });
  page.drawText(data.grossAmount.toLocaleString(), { x: 300, y: tableTop - 50, size: 11, font: thaiFont });
  page.drawText(data.taxAmount.toLocaleString(), { x: 450, y: tableTop - 50, size: 11, font: thaiFont });

  // Total Row
  page.drawLine({
    start: { x: 50, y: tableTop - 120 },
    end: { x: width - 50, y: tableTop - 120 },
    thickness: 1,
  });
  page.drawText("รวมเงินที่จ่ายและภาษีที่หักนำส่ง", { x: 60, y: tableTop - 140, size: 11, font: thaiFont });
  page.drawText(data.grossAmount.toLocaleString(), { x: 300, y: tableTop - 140, size: 11, font: thaiFont });
  page.drawText(data.taxAmount.toLocaleString(), { x: 450, y: tableTop - 140, size: 11, font: thaiFont });

  yOffset -= 170;

  // 5. Certification Section
  page.drawText(`ขอรับรองว่าข้อความข้างต้นถูกต้องตรงกับความเป็นจริงทุกประการ`, {
    x: width / 2 - 120,
    y: yOffset,
    size: 10,
    font: thaiFont,
  });
  yOffset -= 20;
  page.drawText(`ออกให้ ณ วันที่: ${data.date}`, {
    x: width / 2 - 50,
    y: yOffset,
    size: 10,
    font: thaiFont,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
