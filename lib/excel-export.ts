import * as XLSX from "xlsx";

export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  format?: (value: any) => string | number;
}

/**
 * Generate an Excel file buffer from data array
 */
export function generateExcelBuffer(
  data: Record<string, any>[],
  columns: ExcelColumn[],
  sheetName: string = "Sheet1"
): Buffer {
  // Transform data according to columns
  const rows = data.map((item) => {
    const row: Record<string, any> = {};
    for (const col of columns) {
      const value = item[col.key];
      row[col.header] = col.format ? col.format(value) : value ?? "";
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
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
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
