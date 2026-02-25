import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  ExecutiveStats,
  MonthlyRevenue,
  QuarterlyRevenue,
} from "@/features/dashboard/executive-queries";
import { ExecutiveAiInsights } from "@/features/dashboard/executive-ai-actions";
/**
 * Helper to map Thai month abbreviations to English for PDF stability
 */
function mapMonthToEnglish(month: string): string {
  const mapping: Record<string, string> = {
    "ม.ค.": "Jan",
    "ก.พ.": "Feb",
    "มี.ค.": "Mar",
    "เม.ย.": "Apr",
    "พ.ค.": "May",
    "มิ.ย.": "Jun",
    "ก.ค.": "Jul",
    "ส.ค.": "Aug",
    "ก.ย.": "Sep",
    "ต.ค.": "Oct",
    "พ.ย.": "Nov",
    "ธ.ค.": "Dec",
  };
  return mapping[month] || month;
}

/**
 * Helper to format currency safely for PDF (avoiding symbols like ฿ that cause encoding errors)
 */
function formatPdfCurrency(value: number): string {
  return "THB " + Math.round(value).toLocaleString();
}

/**
 * Helper to sanitize text for PDF-lib (standard fonts only support WinAnsi/Latin-1)
 */
function sanitizeForPdf(text: string): string {
  if (!text) return "";
  // Standard fonts in PDF-lib (Helvetica, etc.) only support a limited set of characters.
  // We'll strip any character that cannot be encoded by WinAnsi.
  // For Thai characters (0x0E00-0x0E7F), we'll replace with '?' or just remove.
  return text.replace(/[^\x00-\x7F]/g, "?");
}

/**
 * Generate a professional PDF report for executives
 */
export async function generateExecutivePdf(
  stats: ExecutiveStats,
  monthlyData: MonthlyRevenue[],
  quarterlyData: QuarterlyRevenue[],
  year: number,
  aiInsights?: ExecutiveAiInsights,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yOffset = height - 50;

  // Header
  page.drawText("EXECUTIVE PERFORMANCE REPORT", {
    x: 50,
    y: yOffset,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });
  yOffset -= 30;

  page.drawText(`Business Period: Year ${year + 543} (Buddhist Calendar)`, {
    x: 50,
    y: yOffset,
    size: 12,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  yOffset -= 40;

  // Divider
  page.drawLine({
    start: { x: 50, y: yOffset },
    end: { x: width - 50, y: yOffset },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  yOffset -= 30;

  // Financial Summary Section
  page.drawText("FINANCIAL SUMMARY", {
    x: 50,
    y: yOffset,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yOffset -= 25;

  const drawStat = (label: string, value: string, x: number, y: number) => {
    page.drawText(sanitizeForPdf(label), {
      x,
      y,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText(sanitizeForPdf(value), {
      x,
      y: y - 15,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  };

  drawStat("Total Revenue", formatPdfCurrency(stats.totalRevenue), 50, yOffset);
  drawStat(
    "Total Commission",
    formatPdfCurrency(stats.totalCommission),
    200,
    yOffset,
  );
  drawStat("Total Deals", stats.totalDeals.toString(), 350, yOffset);
  yOffset -= 50;

  drawStat("Sales Revenue", formatPdfCurrency(stats.salesRevenue), 50, yOffset);
  drawStat(
    "Rental Revenue",
    formatPdfCurrency(stats.rentalRevenue),
    200,
    yOffset,
  );
  yOffset -= 60;

  // Monthly breakdown
  page.drawText("MONTHLY PERFORMANCE BREAKDOWN", {
    x: 50,
    y: yOffset,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yOffset -= 20;

  // Table Header
  const tableTop = yOffset;
  page.drawRectangle({
    x: 50,
    y: yOffset - 5,
    width: width - 100,
    height: 20,
    color: rgb(0.95, 0.96, 0.98),
  });

  const drawRow = (
    m: string,
    s: string,
    r: string,
    t: string,
    y: number,
    isTotal = false,
  ) => {
    const font = isTotal ? boldFont : regularFont;
    page.drawText(sanitizeForPdf(m), { x: 60, y, size: 9, font });
    page.drawText(sanitizeForPdf(s), { x: 150, y, size: 9, font });
    page.drawText(sanitizeForPdf(r), { x: 300, y, size: 9, font });
    page.drawText(sanitizeForPdf(t), { x: 450, y, size: 9, font });
  };

  drawRow("Month", "Sales", "Rent", "Total", yOffset);
  yOffset -= 25;

  monthlyData.forEach((m) => {
    if (yOffset < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yOffset = height - 50;
    }
    drawRow(
      mapMonthToEnglish(m.month),
      formatPdfCurrency(m.sales),
      formatPdfCurrency(m.rent),
      formatPdfCurrency(m.total),
      yOffset,
    );
    yOffset -= 15;
  });

  yOffset -= 20;

  // Quarterly Summary
  page.drawText("QUARTERLY SUMMARY", {
    x: 50,
    y: yOffset,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yOffset -= 25;

  quarterlyData.forEach((q) => {
    // Sanitize quarter name which might have Thai like (ม.ค.-มี.ค.)
    const safeQuarterName = q.quarter.split(" ")[0]; // Just use Q1, Q2, etc.
    page.drawText(safeQuarterName, {
      x: 50,
      y: yOffset,
      size: 10,
      font: boldFont,
    });
    page.drawText(formatPdfCurrency(q.total), {
      x: 450,
      y: yOffset,
      size: 10,
      font: boldFont,
    });
    yOffset -= 15;
  });

  // AI Strategic Intelligence (New Page)
  if (aiInsights) {
    page = pdfDoc.addPage([595.28, 841.89]);
    yOffset = height - 50;

    page.drawText("AI STRATEGIC INTELLIGENCE", {
      x: 50,
      y: yOffset,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.3, 0.6),
    });
    yOffset -= 30;

    page.drawText("Executive Summary:", {
      x: 50,
      y: yOffset,
      size: 11,
      font: boldFont,
    });
    yOffset -= 15;

    try {
      const drawWrappedText = (
        text: string,
        x: number,
        y: number,
        maxLength: number,
      ) => {
        const words = text.split(/\s+/);
        let line = "";
        let currentY = y;
        for (const word of words) {
          const sanitizedWord = sanitizeForPdf(word);
          if ((line + sanitizedWord).length > maxLength) {
            page.drawText(line, { x, y: currentY, size: 9, font: regularFont });
            line = sanitizedWord + " ";
            currentY -= 12;
          } else {
            line += sanitizedWord + " ";
          }
        }
        page.drawText(line, { x, y: currentY, size: 9, font: regularFont });
        return currentY - 15;
      };

      yOffset = drawWrappedText(aiInsights.summary, 50, yOffset, 100);
      yOffset -= 10;

      page.drawText("Strategic Trends:", {
        x: 50,
        y: yOffset,
        size: 11,
        font: boldFont,
      });
      yOffset -= 15;
      aiInsights.trends.forEach((t) => {
        yOffset = drawWrappedText(`* ${t}`, 60, yOffset, 90);
      });
      yOffset -= 10;

      page.drawText("Actionable Recommendations:", {
        x: 50,
        y: yOffset,
        size: 11,
        font: boldFont,
      });
      yOffset -= 15;
      aiInsights.recommendations.forEach((r) => {
        yOffset = drawWrappedText(`* ${r}`, 60, yOffset, 90);
      });
      yOffset -= 10;

      page.drawText("Business Forecast:", {
        x: 50,
        y: yOffset,
        size: 11,
        font: boldFont,
      });
      yOffset -= 15;
      yOffset = drawWrappedText(aiInsights.forecast, 60, yOffset, 90);
    } catch (e) {
      console.error("[generateExecutivePdf] AI Section Rendering Error:", e);
      page.drawText(
        "Note: Detailed AI insights could not be rendered in PDF due to character encoding.",
        { x: 50, y: yOffset, size: 10, font: regularFont },
      );
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
