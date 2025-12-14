"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { updateProfileAction, uploadAvatarAction } from "./actions";
import { toast } from "sonner";
import type { Profile } from "@/lib/supabase/getCurrentProfile";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");
  const [fullName, setFullName] = useState(profile.full_name || "");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB");
      return;
    }

    // แสดง Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // อัปโหลดรูปภาพ
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      await uploadAvatarAction(formData);
      toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      setAvatarPreview(profile.avatar_url || "");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateProfileAction(formData);

      if (result.success) {
        toast.success("บันทึกข้อมูลโปรไฟล์สำเร็จ");
        router.refresh();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-border">
            <AvatarImage src={avatarPreview} alt={profile.full_name || ""} />
            <AvatarFallback className="text-3xl bg-primary/5 font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <label 
            htmlFor="avatar-upload" 
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="h-8 w-8 text-white" />
          </label>
          
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์
          </p>
          <p className="text-xs text-muted-foreground">
            รองรับไฟล์ JPG, PNG (ไม่เกิน 2MB)
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
          <Input
            id="full_name"
            name="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="กรอกชื่อ-นามสกุล"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            name="email"
            value={profile.email || ""}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            ไม่สามารถแก้ไขอีเมลได้
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">บทบาท</Label>
          <Input
            id="role"
            name="role"
            value={profile.role || "AGENT"}
            disabled
            className="bg-muted cursor-not-allowed capitalize"
          />
          <p className="text-xs text-muted-foreground">
            ติดต่อผู้ดูแลระบบเพื่อเปลี่ยนบทบาท
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            "บันทึกการเปลี่ยนแปลง"
          )}
        </Button>
      </div>
    </form>
  );
}
