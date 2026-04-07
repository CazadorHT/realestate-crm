"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ServiceForm } from "./ServiceForm";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function CreateServiceDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSuccess = () => {
    setOpen(false);
    
    // Add success param to trigger animation
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    
    // Refresh to get new data
    router.refresh();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="สร้างบริการใหม่"
      description="ระบุรายละเอียดเบื้องต้นสำหรับบริการใหม่ของคุณเพื่อเริ่มการนำเสนอ"
      className="md:max-w-6xl"
      trigger={
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-5 w-5 mr-2" />
          สร้างบริการใหม่
        </Button>
      }
    >
      <ServiceForm onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
    </ResponsiveDialog>
  );
}
