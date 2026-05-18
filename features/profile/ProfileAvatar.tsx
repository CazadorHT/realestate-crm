"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatarAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
          // Dynamic import to reduce initial bundle size
          const { default: imageCompression } =
            await import("browser-image-compression");
          fileToUpload = await imageCompression(file, options);
        } catch (compressionError) {
          console.error(
            "Compression failed, trying original if size permits",
            compressionError,
          );
          // Still must check the 5MB limit for the final upload
          if (file.size > 5 * 1024 * 1024) {
            toast.error(
              "ไฟล์มีขนาดใหญ่เกินไปและไม่สามารถบีบอัดได้ (ต้องไม่เกิน 5MB)",
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
    <div className="flex flex-col items-center gap-5">
      <div className="relative group/avatar">
        <m.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative"
        >
          <Avatar className="h-40 w-40 border-4 border-white shadow-2xl ring-1 ring-slate-100 overflow-hidden">
            <AvatarImage
              src={preview}
              alt={fullName || ""}
              className="object-cover"
            />
            <AvatarFallback className="text-5xl bg-slate-50 font-semibold text-slate-300">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Luxury Hover Overlay */}
          <label
            htmlFor="avatar-upload"
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/60 backdrop-blur-[3px] rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 cursor-pointer overflow-hidden",
              isUploading && "opacity-100",
            )}
          >
            <div className="absolute inset-0 bg-linear-to-t from-indigo-950/40 to-transparent" />
            <AnimatePresence mode="wait">
              {isUploading ? (
                <m.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </m.div>
              ) : (
                <m.div
                  key="camera"
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center gap-3 z-10"
                >
                  <div className="p-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500 group-hover/avatar:scale-110 group-hover/avatar:bg-white/20">
                    <Camera className="h-7 w-7 text-white drop-shadow-xl" />
                  </div>
                  <span className="text-[10px] text-white font-black uppercase tracking-[0.2em] drop-shadow-md">
                    อัพรูปภาพ
                  </span>
                </m.div>
              )}
            </AnimatePresence>
          </label>
        </m.div>

        {/* Status Indicator */}
        <div
          className="absolute bottom-3 right-3 h-6 w-6 rounded-full bg-emerald-500 border-4 border-white shadow-lg animate-pulse"
          title="ออนไลน์"
        />

        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
          disabled={isUploading}
        />
      </div>

      <div className="text-center space-y-1">
        <div className="flex items-center gap-2 justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
            Profile Identity
          </p>
        </div>
        <p className="text-[10px] text-slate-400 max-w-[150px] leading-tight">
          รูปนี้จะแสดงในระบบสมาชิกและเอกสารที่เกี่ยวข้อง
        </p>
      </div>
    </div>
  );
}
