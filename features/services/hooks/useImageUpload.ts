"use client";

import * as React from "react";
import { toast } from "sonner";
import { uploadServiceImageAction } from "@/features/services/actions";
import { Area } from "react-easy-crop";
import getCroppedImg from "@/lib/utils/cropImage";
import { useLanguage } from "@/lib/i18n/language-context";

interface UseImageUploadProps {
  mode: "single" | "gallery";
  onChange: (value: string | string[]) => void;
  value?: string | string[];
}

export function useImageUpload({ mode, onChange, value }: UseImageUploadProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{ [key: string]: number }>({});
  
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [cropFile, setCropFile] = React.useState<File | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);

  const onCropComplete = React.useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSingleUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isEn ? "File size too large (max 2MB)" : "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result as string);
      setCropFile(file);
    });
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = async (files: File[]) => {
    setIsUploading(true);
    
    const uploadPromises = files.map(async (file, index) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(isEn ? `${file.name} is too large (max 2MB)` : `${file.name} มีขนาดใหญ่เกินไป (สูงสุด 2MB)`);
        return null;
      }
      const fileId = `${file.name}-${index}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await uploadServiceImageAction(formData);
        
        if (res.success && res.data?.publicUrl) {
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          return res.data.publicUrl;
        } else {
          toast.error(isEn ? `Failed to upload ${file.name}` : `ไม่สามารถอัปโหลด ${file.name} ได้`);
          return null;
        }
      } catch (error) {
        toast.error(isEn ? `Error uploading ${file.name}` : `เกิดข้อผิดพลาดในการอัปโหลด ${file.name}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const newUrls = results.filter((url): url is string => url !== null);
    
    if (newUrls.length > 0) {
      const currentGallery = Array.isArray(value) ? value : [];
      onChange([...currentGallery, ...newUrls]);
      toast.success(
        isEn
          ? `Uploaded ${newUrls.length} image(s) successfully ✨`
          : `อัปโหลดสำเร็จ ${newUrls.length} รูป ✨`
      );
    }
    
    setIsUploading(false);
    setUploadProgress({});
  };

  const handleCropSave = async () => {
    if (!cropFile || !imageToCrop || !croppedAreaPixels) return;
    
    setIsUploading(true);
    setImageToCrop(null);
    
    try {
      const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!blob) throw new Error(isEn ? "Failed to process image" : "ไม่สามารถประมวลผลรูปภาพได้");
      
      const file = new File([blob], cropFile.name, { type: "image/jpeg" });
      
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await uploadServiceImageAction(formData);
      
      if (res.success && res.data?.publicUrl) {
        onChange(res.data.publicUrl);
        toast.success(isEn ? "Image uploaded successfully ✨" : "อัปโหลดรูปภาพสำเร็จ ✨");
      } else {
        toast.error(res.message || (isEn ? "Upload failed" : "การอัปโหลดขัดข้อง"));
      }
    } catch (error: any) {
      toast.error(error.message || (isEn ? "Error processing image" : "เกิดข้อผิดพลาดในการประมวลผลรูปภาพ"));
    } finally {
      setIsUploading(false);
      setCropFile(null);
      setCroppedAreaPixels(null);
    }
  };


  return {
    isUploading,
    uploadProgress,
    imageToCrop,
    setImageToCrop,
    crop,
    setCrop,
    zoom,
    setZoom,
    onCropComplete,
    handleSingleUpload,
    handleGalleryUpload,
    handleCropSave,
    croppedAreaPixels
  };
}
