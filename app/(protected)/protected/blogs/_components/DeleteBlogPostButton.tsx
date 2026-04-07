"use client";

import { deleteBlogPostAction } from "@/features/blog/actions";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

interface DeleteBlogPostButtonProps {
  id: string;
  variant?: "icon" | "full";
  onSuccess?: () => void;
}

export function DeleteBlogPostButton({ id, variant = "icon", onSuccess }: DeleteBlogPostButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
    onSuccess?.();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const res = await deleteBlogPostAction(id);
      if (res.success) {
        toast.success(res.message);
        handleSuccessFeedback();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
            title="ลบ"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl justify-start font-bold gap-3 border-slate-200 text-destructive hover:text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-5 w-5" />
            ย้ายลงถังขยะ
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl sm:rounded-2xl border-slate-200 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-extrabold text-xl text-slate-900 border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-destructive" />
            ย้ายบทความลงถังขยะ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
            บทความนี้จะถูกย้ายจากหน้าหลักไปเก็บไว้ในถังขยะ 
            <br />
            โดยคุณสามารถ <span className="text-slate-900 font-bold underline">กู้คืน (Restore)</span> ได้ในภายหลัง
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0 pt-4 mt-2">
          <AlertDialogCancel className="rounded-xl h-11 font-bold border-slate-200">ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90 text-white rounded-xl h-11 font-bold shadow-lg shadow-red-100 transition-all active:scale-95"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            ย้ายลงถังขยะ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
