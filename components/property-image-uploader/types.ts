export interface ImageItem {
  id: string;
  storage_path: string;
  preview_url: string;
  is_cover: boolean;
  is_uploading?: boolean;
  file?: File; // For new uploads
  origin?: "initial" | "temp";
  hasError?: boolean;
}

export interface PropertyImageUploaderProps {
  sessionId: string;
  value: string[]; // storage paths จาก react-hook-form
  onChange: (paths: string[]) => void;
  initialImages?: {
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }[];
  maxFiles?: number;
  maxFileSizeMB?: number;
  disabled?: boolean;
  cleanupOnUnmount?: boolean; // ถ้า true → ออกจากหน้านี้โดยไม่ submit ให้ลบรูปทิ้ง
}
