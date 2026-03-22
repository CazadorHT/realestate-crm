"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { ProvinceSelector } from "./ProvinceSelector";

export function CreatePopularAreaButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemNameEn, setItemNameEn] = useState("");
  const [itemNameCn, setItemNameCn] = useState("");
  const [itemProvince, setItemProvince] = useState("กรุงเทพมหานคร");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleSave = async () => {
    if (!itemName.trim()) return toast.error("ชื่อทำเลห้ามว่าง");

    setIsLoading(true);
    const res = await createPopularAreaAction(
      itemName,
      itemProvince,
      itemNameEn,
      itemNameCn,
    );
    setIsLoading(false);

    if (res?.success === false) {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    } else {
      toast.success(res.message || "เพิ่มทำเลสำเร็จ");
      setIsDialogOpen(false);
      setItemName("");
      setItemNameEn("");
      setItemNameCn("");
      setItemProvince("กรุงเทพมหานคร");
      handleSuccessFeedback();
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
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">จังหวัด</label>
              <ProvinceSelector
                value={itemProvince}
                onChange={setItemProvince}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ชื่อทำเล (ไทย)</label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="เช่น สุขุมวิท, ทองหล่อ"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (English)</label>
              <Input
                value={itemNameEn}
                onChange={(e) => setItemNameEn(e.target.value)}
                placeholder="e.g. Sukhumvit, Thong Lo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">名称 (Chinese)</label>
              <Input
                value={itemNameCn}
                onChange={(e) => setItemNameCn(e.target.value)}
                placeholder="例如：素坤逸, 通罗"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !itemName.trim() || !itemProvince.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed px-8"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              บันทึก
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
