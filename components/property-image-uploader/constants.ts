export const IMAGE_UPLOAD_POLICY = {
  maxBytes: 40 * 1024 * 1024, // ปรับตรงนี้ครั้งเดียว
  maxFiles: 20,
  allowedMime: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const,
  // allowedExt ให้ถือจาก file-validation เป็นหลัก
};
