"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadBlogImageAction } from "@/features/blog/actions";

interface BlogImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function BlogImageUploader({
  value,
  onChange,
  disabled = false,
}: BlogImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setIsUploading(true);
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadBlogImageAction(formData);

        if (result.success && result.data?.publicUrl) {
          onChange(result.data.publicUrl);
          setPreview(result.data.publicUrl); // Update with real URL
          toast.success("Image uploaded successfully");
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
        setPreview(""); // Revert preview
        onChange("");
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    onChange("");
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40",
        isDragActive && "border-primary bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed",
        preview ? "border-solid p-0 overflow-hidden bg-background" : ""
      )}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative w-full h-full min-h-[200px]">
          <img
            src={preview}
            alt="Cover"
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 shadow-md"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <div className="p-4 rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isUploading ? "Uploading..." : "Click or drag to upload cover"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WebP (Max 5MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
