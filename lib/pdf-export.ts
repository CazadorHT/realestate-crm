import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  ExecutiveStats,
  MonthlyRevenue,
  QuarterlyRevenue,
} from "@/features/dashboard/executive-queries";
import { formatThaiCurrency } from "./excel-export";

/**
 * Generate a professional PDF report for executives
 */
export async function generateExecutivePdf(
  stats: ExecutiveStats,
  monthlyData: MonthlyRevenue[],
  quarterlyData: QuarterlyRevenue[],
  year: number,
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

  page.drawText(
    `Business Period: Year ${year + 543} (Thai Buddhist Calendar)`,
    {
      x: 50,
      y: yOffset,
      size: 12,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    },
  );
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
    page.drawText(label, {
      x,
      y,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText(value, {
      x,
      y: y - 15,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  };

  drawStat(
    "Total Revenue",
    formatThaiCurrency(stats.totalRevenue),
    50,
    yOffset,
  );
  drawStat(
    "Total Commission",
    formatThaiCurrency(stats.totalCommission),
    200,
    yOffset,
  );
  drawStat("Total Deals", stats.totalDeals.toString(), 350, yOffset);
  yOffset -= 50;

  drawStat(
    "Sales Revenue",
    formatThaiCurrency(stats.salesRevenue),
    50,
    yOffset,
  );
  drawStat(
    "Rental Revenue",
    formatThaiCurrency(stats.rentalRevenue),
    200,
    yOffset,
  );
  yOffset -= 60;

  // Monthly breakdown
  page.drawText("MONTHLY PERFORMANCE", {
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
    page.drawText(m, { x: 60, y, size: 9, font });
    page.drawText(s, { x: 150, y, size: 9, font });
    page.drawText(r, { x: 300, y, size: 9, font });
    page.drawText(t, { x: 450, y, size: 9, font });
  };

  drawRow("Month", "Sales", "Rent", "Total", yOffset);
  yOffset -= 25;

  monthlyData.forEach((m, i) => {
    if (yOffset < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yOffset = height - 50;
    }
    drawRow(
      m.month,
      formatThaiCurrency(m.sales),
      formatThaiCurrency(m.rent),
      formatThaiCurrency(m.total),
      yOffset,
    );
    yOffset -= 15;
  });

  yOffset -= 20;

  // Quarterly Summary
  page.drawText("QUARTERLY PERFORMANCE", {
    x: 50,
    y: yOffset,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yOffset -= 25;

  quarterlyData.forEach((q) => {
    page.drawText(q.quarter, { x: 50, y: yOffset, size: 10, font: boldFont });
    page.drawText(formatThaiCurrency(q.total), {
      x: 450,
      y: yOffset,
      size: 10,
      font: boldFont,
    });
    yOffset -= 15;
  });

  // Footer on all pages (simplified)
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
