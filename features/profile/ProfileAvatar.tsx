"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatarAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  fullName: string | null;
}

export function ProfileAvatar({ avatarUrl, fullName }: ProfileAvatarProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(avatarUrl || undefined);

  useEffect(() => {
    setPreview(avatarUrl || undefined);
  }, [avatarUrl]);

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Initial state
    setIsUploading(true);

    try {
      let fileToUpload = file;

      // Compress if file is large (> 1MB) or just to be safe
      // We target 1MB to stay very safe under 2MB
      if (file.size > 1 * 1024 * 1024) {
        const options = {
          maxSizeMB: 1, // Aim for 1MB
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };

        try {
          fileToUpload = await imageCompression(file, options);
        } catch (compressionError) {
          console.error(
            "Compression failed, trying original if size permits",
            compressionError,
          );
          // Still must check the 2MB limit for the final upload
          if (file.size > 2 * 1024 * 1024) {
            toast.error(
              "ไฟล์มีขนาดใหญ่เกินไปและไม่สามารถบีบอัดได้ (ต้องไม่เกิน 2MB)",
            );
            setIsUploading(false);
            return;
          }
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload, file.name);

      await uploadAvatarAction(formData);
      toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      setPreview(avatarUrl || undefined);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-32 w-32 border-4 border-border ring-2 ring-offset-2 ring-primary/10">
          <AvatarImage src={preview} alt={fullName || ""} />
          <AvatarFallback className="text-4xl bg-primary/5 font-bold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <label
          htmlFor="avatar-upload"
          className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${isUploading ? "opacity-100" : ""}`}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </label>

        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
          disabled={isUploading}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ระบบจะบีบอัดอัตโนมัติหากไฟล์ใหญ่ (ไม่เกิน 2MB)
        </p>
      </div>
    </div>
  );
}
