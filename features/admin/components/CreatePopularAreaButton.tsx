"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPopularAreaAction } from "@/features/admin/popular-areas-actions";

export function CreatePopularAreaButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!itemName.trim()) return toast.error("ชื่อทำเลห้ามว่าง");

    setIsLoading(true);
    const res = await createPopularAreaAction(itemName);
    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("เพิ่มทำเลสำเร็จ");
      setIsDialogOpen(false);
      setItemName("");
      window.location.reload();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-white text-slate-800 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" />
          เพิ่มทำเลใหม่
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มทำเลใหม่</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ชื่อทำเล (Keyword)</label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="เช่น สุขุมวิท, ทองหล่อ"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
