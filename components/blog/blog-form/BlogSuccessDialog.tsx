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
import { useLanguage } from "@/lib/i18n/language-context";

interface BlogSuccessDialogProps {
  successData: { slug: string; isPublished: boolean } | null;
  onOpenChange: (open: boolean) => void;
}

export function BlogSuccessDialog({
  successData,
  onOpenChange,
}: BlogSuccessDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
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
          <DialogTitle className="flex items-center gap-3 text-emerald-600 text-xl font-bold">
            <div className="p-2 bg-emerald-100 rounded-full">
              <ExternalLinkIcon className="w-6 h-6" />
            </div>
            {isEn ? "Article Saved Successfully" : "บันทึกบทความสำเร็จ"}
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 pt-2 font-medium">
            {isEn ? "What would you like to do next?" : "คุณต้องการทำรายการใดต่อ?"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="outline"
            disabled={!isPublished}
            className="w-full justify-start gap-3 h-14 text-base font-semibold border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            onClick={() => {
              if (successData?.slug) {
                window.open(`/blog/${successData.slug}`, "_blank");
                router.refresh();
                router.push("/protected/blogs");
              } else {
                toast.error(isEn ? "Slug not found to open page" : "ไม่พบข้อมูล Slug สำหรับเปิดหน้าเว็บ");
              }
            }}
          >
            <ExternalLinkIcon className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col items-start">
              <span>{isEn ? "View Blog Page" : "ดูหน้าบทความ"}</span>
              <span className="text-xs text-slate-400 font-normal">
                {isPublished 
                  ? (isEn ? "Open in a new tab to view live page" : "เปิดแท็บใหม่เพื่อดูตัวอย่างหน้าจริง") 
                  : (isEn ? "Article is a draft (publish first to view page)" : "บทความนี้เป็นแบบร่าง (เปิดเผยแพร่ก่อนเพื่อดูหน้าเว็บ)")}
              </span>
            </div>
          </Button>

          <Button
            className="w-full justify-start gap-3 h-14 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
            onClick={() => {
              router.refresh();
              router.push("/protected/blogs");
            }}
          >
            <ListIcon className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span>{isEn ? "Back to Articles List" : "กลับหน้ารายการบทความ"}</span>
              <span className="text-xs text-slate-400/80 font-normal">
                {isEn ? "Continue managing other articles" : "จัดการบทความอื่นต่อ"}
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
