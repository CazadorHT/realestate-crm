"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Plus } from "lucide-react";
import { createPopularArea } from "@/features/admin/popular-areas-actions";
import { PopularAreaForm } from "./PopularAreaForm";

export function CreatePopularAreaButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsDialogOpen(false);
    router.refresh();
  };

  return (
    <ResponsiveDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      title="เพิ่มทำเลใหม่"
      description="ระบุชื่อทำเลและจังหวัดให้ถูกต้องเพื่อการแสดงผลในระบบ"
      className="md:max-w-2xl"
      trigger={
        <Button
          size="lg"
          className="bg-white text-slate-800 hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 font-bold rounded-2xl h-12 border border-slate-100"
        >
          <Plus className="mr-2 h-5 w-5 text-indigo-600" />
          เพิ่มทำเลใหม่
        </Button>
      }
    >
      <div className="py-4">
        <PopularAreaForm 
          onSuccess={handleSuccess}
          onCancel={() => setIsDialogOpen(false)}
          saveAction={createPopularArea}
        />
      </div>
    </ResponsiveDialog>
  );
}
