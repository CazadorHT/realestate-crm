// ✅ ทำให้ไฟล์หลังบีบอัด “มีชื่อ+นามสกุลที่ถูกต้อง” เสมอ (กัน server reject เพราะชื่อไฟล์เป็น "blob")
export function normalizeImageFileName(
  file: File,
  originalName?: string,
): File {
  const type = file.type || "image/webp";

  const extByType: Record<string, string> = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const ext = extByType[type] ?? "webp";

  const baseFromOriginal = (originalName || file.name || "image")
    .trim()
    .replace(/\.[a-z0-9]+$/i, ""); // ตัด extension เดิม

  const safeBase = baseFromOriginal.replace(/[^\w\- ]+/g, "").trim() || "image";

  const outName = `${safeBase}.${ext}`;

  // ถ้าชื่อเดิมโอเคอยู่แล้ว และมี extension ที่ถูกต้อง ก็คืนตัวเดิม
  if (file.name?.trim() && /\.([a-z0-9]+)\s*$/i.test(file.name)) {
    const currentExt = file.name.trim().match(/\.([a-z0-9]+)\s*$/i)?.[1];
    if (currentExt && currentExt.toLowerCase() === ext) return file;
  }

  return new File([file], outName, { type, lastModified: Date.now() });
}
