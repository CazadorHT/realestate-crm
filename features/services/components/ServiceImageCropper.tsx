import * as React from "react";
import { 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut,
} from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

interface ServiceImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string | null;
  crop: { x: number; y: number };
  onCropChange: (crop: { x: number; y: number }) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  aspectRatio: number;
  onCropComplete: (area: any, pixels: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ServiceImageCropper({
  open,
  onOpenChange,
  image,
  crop,
  onCropChange,
  zoom,
  onZoomChange,
  aspectRatio,
  onCropComplete,
  onSave,
  onCancel,
}: ServiceImageCropperProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-6 bg-white border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
             <ImageIcon className="w-5 h-5 text-indigo-500" />
             {isEn ? "Crop & Adjust Image" : "จัดกึ่งกลางและตัดรูปภาพ"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-slate-950 min-h-[400px]">
          {image && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onCropComplete={onCropComplete}
              onZoomChange={onZoomChange}
            />
          )}
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t flex flex-col gap-6">
          <div className="flex items-center gap-6 w-full bg-white p-3 rounded-2xl border border-slate-200">
            <ZoomOut className="w-5 h-5 text-slate-400" />
            <Slider
              value={[zoom]} min={1} max={3} step={0.1}
              onValueChange={(vals) => onZoomChange(vals[0])}
              className="flex-1"
            />
            <ZoomIn className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              className="rounded-xl h-11 px-6 font-bold text-slate-500 border-slate-200"
              onClick={onCancel}
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button
              className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
              onClick={onSave}
            >
              {isEn ? "Save Crop" : "บันทึกการตัดรูปภาพ"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
