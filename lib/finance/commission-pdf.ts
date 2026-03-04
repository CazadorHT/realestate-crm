import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatThaiCurrency } from "@/lib/excel-export";

export interface CommissionStatementData {
  dealId: string;
  dealTitle: string;
  agentName: string;
  role: string;
  percentage: number;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  date: string;
}

/**
 * Helper to sanitize text for PDF-lib (standard fonts only support WinAnsi/Latin-1)
 */
function sanitizeForPdf(text: string): string {
  if (!text) return "";
  return text.replace(/[^\x00-\x7F]/g, "?");
}

/**
 * Format currency for PDF (avoiding symbols like ฿ that cause encoding errors)
 */
function formatPdfCurrency(value: number): string {
  return "THB " + Math.round(value).toLocaleString();
}

/**
 * Generate a professional Commission Statement PDF
 */
export async function generateCommissionPdf(
  data: CommissionStatementData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 420.94]); // A5 Landscape-ish
  const { width, height } = page.getSize();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yOffset = height - 50;

  // Header
  page.drawText("COMMISSION STATEMENT", {
    x: 50,
    y: yOffset,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawText(`Date: ${data.date}`, {
    x: width - 150,
    y: yOffset,
    size: 10,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  yOffset -= 30;

  // Divider
  page.drawLine({
    start: { x: 50, y: yOffset },
    end: { x: width - 50, y: yOffset },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  yOffset -= 30;

  // Recipient Info
  page.drawText("RECIPIENT DETAILS", {
    x: 50,
    y: yOffset,
    size: 10,
    font: boldFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  yOffset -= 15;

  page.drawText(`Name: ${sanitizeForPdf(data.agentName)}`, {
    x: 50,
    y: yOffset,
    size: 11,
    font: regularFont,
  });
  page.drawText(`Role: ${sanitizeForPdf(data.role)}`, {
    x: 250,
    y: yOffset,
    size: 11,
    font: regularFont,
  });
  yOffset -= 25;

  // Deal Info
  page.drawText("DEAL INFORMATION", {
    x: 50,
    y: yOffset,
    size: 10,
    font: boldFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  yOffset -= 15;

  page.drawText(`Deal: ${sanitizeForPdf(data.dealTitle)}`, {
    x: 50,
    y: yOffset,
    size: 11,
    font: regularFont,
  });
  page.drawText(`ID: ${data.dealId.slice(0, 8)}`, {
    x: 250,
    y: yOffset,
    size: 11,
    font: regularFont,
  });
  yOffset -= 40;

  // Calculation Table Header
  page.drawRectangle({
    x: 50,
    y: yOffset - 5,
    width: width - 100,
    height: 20,
    color: rgb(0.95, 0.96, 0.98),
  });

  const drawRow = (
    label: string,
    value: string,
    y: number,
    isTotal = false,
  ) => {
    const font = isTotal ? boldFont : regularFont;
    const size = isTotal ? 11 : 10;
    page.drawText(label, { x: 60, y, size, font });

    // Right align: Calculate width and subtract from margin
    const valueWidth = font.widthOfTextAtSize(value, size);
    page.drawText(value, { x: width - 60 - valueWidth, y, size, font });
  };

  drawRow("Description", "Amount", yOffset);
  yOffset -= 25;

  drawRow(
    `Gross Commission (${data.percentage}%)`,
    formatPdfCurrency(data.grossAmount),
    yOffset,
  );
  yOffset -= 20;

  drawRow(
    "Withholding Tax (3%)",
    `-${formatPdfCurrency(data.whtAmount)}`,
    yOffset,
  );
  yOffset -= 10;

  // Sub-divider
  page.drawLine({
    start: { x: 50, y: yOffset },
    end: { x: width - 50, y: yOffset },
    thickness: 0.5,
    color: rgb(0.9, 0.9, 0.9),
  });
  yOffset -= 20;

  // Net Amount
  page.drawRectangle({
    x: 50,
    y: yOffset - 8,
    width: width - 100,
    height: 25,
    color: rgb(0.1, 0.4, 0.8),
    opacity: 0.05,
  });

  page.drawText("NET PAYOUT AMOUNT", {
    x: 60,
    y: yOffset,
    size: 12,
    font: boldFont,
    color: rgb(0.1, 0.4, 0.8),
  });

  const netPayStr = formatPdfCurrency(data.netAmount);
  const netPayWidth = boldFont.widthOfTextAtSize(netPayStr, 12);
  page.drawText(netPayStr, {
    x: width - 60 - netPayWidth,
    y: yOffset,
    size: 12,
    font: boldFont,
    color: rgb(0.1, 0.4, 0.8),
  });

  yOffset -= 40;

  page.drawText("Thank you for your hard work!", {
    x: width / 2 - 70,
    y: yOffset,
    size: 9,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
