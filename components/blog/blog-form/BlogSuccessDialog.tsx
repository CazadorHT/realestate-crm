"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink as ExternalLinkIcon, List as ListIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BlogSuccessDialogProps {
  successData: { slug: string; isPublished: boolean } | null;
  onOpenChange: (open: boolean) => void;
}

export function BlogSuccessDialog({
  successData,
  onOpenChange,
}: BlogSuccessDialogProps) {
  const router = useRouter();
  const isPublished = !!successData?.isPublished;

  return (
    <Dialog
      open={!!successData}
      
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
          router.refresh(); // บังคับรีเฟรชข้อมูลใหม่
          router.push("/protected/blogs");
        }
      }}
    >
      <DialogContent className="sm:max-w-md! bg-white border-0 shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-emerald-600 text-xl">
            <div className="p-2 bg-emerald-100 rounded-full">
              <ExternalLinkIcon className="w-6 h-6" />
            </div>
            บันทึกบทความสำเร็จ
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 pt-2">
            คุณต้องการทำรายการใดต่อ?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="outline"
            disabled={!isPublished}
            className="w-full justify-start gap-3 h-14 text-base font-medium border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => {
              if (successData?.slug) {
                window.open(`/blog/${successData.slug}`, "_blank");
                router.refresh();
                router.push("/protected/blogs");
              } else {
                toast.error("ไม่พบข้อมูล Slug สำหรับเปิดหน้าเว็บ");
              }
            }}
          >
            <ExternalLinkIcon className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col items-start">
              <span>ดูหน้าบทความ (Blog Page)</span>
              <span className="text-xs text-slate-400 font-normal">
                {isPublished 
                  ? "เปิดแท็บใหม่เพื่อดูตัวอย่างหน้าจริง" 
                  : "บทความนี้เป็นแบบร่าง (เปิดเผยแพร่ก่อนเพื่อดูหน้าเว็บ)"}
              </span>
            </div>
          </Button>

          <Button
            className="w-full justify-start gap-3 h-14 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            onClick={() => {
              router.refresh();
              router.push("/protected/blogs");
            }}
          >
            <ListIcon className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span>กลับหน้ารายการบทความ </span>
              <span className="text-xs text-slate-400/80 font-normal">
                จัดการบทความอื่นต่อ
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
