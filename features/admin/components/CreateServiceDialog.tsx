"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-5 w-5 mr-2" />
          สร้างบริการใหม่
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างบริการใหม่</DialogTitle>
        </DialogHeader>
        <ServiceForm onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
