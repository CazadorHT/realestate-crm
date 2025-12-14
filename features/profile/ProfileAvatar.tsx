"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatarAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  fullName: string | null;
}

export function ProfileAvatar({ avatarUrl, fullName }: ProfileAvatarProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(avatarUrl || "");

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

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB");
      return;
    }

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

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      await uploadAvatarAction(formData);
      toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      setPreview(avatarUrl || "");
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
          รองรับ JPG, PNG (ไม่เกิน 2MB)
        </p>
      </div>
    </div>
  );
}
