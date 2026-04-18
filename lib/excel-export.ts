export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  format?: (value: any) => string | number;
}

export interface ExcelSheet {
  name: string;
  data: Record<string, any>[];
  columns: ExcelColumn[];
}

/**
 * Generate an Excel file buffer from data array
 */
export async function generateExcelBuffer(
  data: Record<string, any>[],
  columns: ExcelColumn[],
  sheetName: string = "Sheet1",
): Promise<Buffer> {
  const XLSX = await import("xlsx");

  // Transform data according to columns
  const rows = data.map((item) => {
    const row: Record<string, any> = {};
    for (const col of columns) {
      const value = item[col.key];
      row[col.header] = col.format ? col.format(value) : (value ?? "");
    }
    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet["!cols"] = columns.map((col) => ({
    wch: col.width || 15,
  }));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate buffer
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Generate a Multi-Sheet Excel file buffer
 */
export async function generateMultiSheetExcelBuffer(
  sheets: ExcelSheet[]
): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const rows = sheet.data.map((item) => {
      const row: Record<string, any> = {};
      for (const col of sheet.columns) {
        const value = item[col.key];
        row[col.header] = col.format ? col.format(value) : (value ?? "");
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = sheet.columns.map((col) => ({
      wch: col.width || 15,
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Format currency for Thai Baht
 */
export function formatThaiCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date for Thai locale
 */
export function formatThaiDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format boolean as Yes/No in Thai
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value == null) return "-";
  return value ? "ใช่" : "ไม่";
}

/**
 * Format Listing Type to Thai
 */
export function formatListingType(value: string | null | undefined): string {
  if (!value) return "-";
  const map: Record<string, string> = {
    SALE: "ขาย",
    RENT: "เช่า",
    SALE_AND_RENT: "ขาย/เช่า",
  };
  return map[value] || value;
}

/**
 * Format Property Status to Thai
 */
export function formatPropertyStatus(value: string | null | undefined): string {
  if (!value) return "-";
  const map: Record<string, string> = {
    AVAILABLE: "ว่าง (พร้อมขาย/เช่า)",
    SOLD: "ขายแล้ว",
    RENTED: "เช่าแล้ว",
    RESERVED: "จองแล้ว",
    OFF_MARKET: "ปิดประกาศ",
    TRASH: "ถังขยะ",
  };
  return map[value] || value;
}
