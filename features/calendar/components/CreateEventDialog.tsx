"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Calendar,
  Clock,
  User,
  Building2,
  StickyNote,
  Briefcase,
  Phone,
  MessageCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointment } from "@/features/calendar/actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; // Rename import to avoid conflict with Lucide icon
import { cn, formatDate } from "@/lib/utils";
import { format } from "date-fns";

interface CreateEventDialogProps {
  leads: { id: string; full_name: string }[];
  properties: { id: string; title: string }[];
}

// Helper to generate time slots
const timeOptions = Array.from({ length: 96 }).map((_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

export function CreateEventDialog({
  leads,
  properties,
}: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState<Date>();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createAppointment(formData);
        toast.success("สร้างนัดหมายสำเร็จ");
        setOpen(false);
        setDate(undefined); // Reset date
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการสร้างนัดหมาย");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">เพิ่มนัดหมาย</span>
          <span className="sm:hidden">เพิ่ม</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>สร้างนัดหมายใหม่</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="leadId" className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" /> ลูกค้า (Lead)
            </Label>
            <Select name="leadId" required>
              <SelectTrigger>
                <SelectValue placeholder="เลือกลูกค้า..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="propertyId" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" /> ทรัพย์สิน
              (Optional)
            </Label>
            <Select name="propertyId" defaultValue="none">
              <SelectTrigger>
                <SelectValue placeholder="เลือกทรัพย์สิน..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="activityType" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-500" /> ประเภทนัดหมาย
            </Label>
            <Select name="activityType" defaultValue="VIEWING">
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWING">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>เยี่ยมชมทรัพย์ (Viewing)</span>
                  </div>
                </SelectItem>
                <SelectItem value="FOLLOW_UP">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-500" />
                    <span>ติดตามผล / เจรจา (Follow up / Deal)</span>
                  </div>
                </SelectItem>
                <SelectItem value="CALL">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span>โทรศัพท์ (Call)</span>
                  </div>
                </SelectItem>
                <SelectItem value="LINE_CHAT">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span>ไลน์ (Line Chat)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" /> วันที่
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    {date ? formatDate(date) : <span>เลือกวันที่</span>}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="date"
                value={date ? format(date, "yyyy-MM-dd") : ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" /> เวลา
              </Label>
              <Select name="time" required>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเวลา..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time} น.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-slate-500" /> บันทึกเพิ่มเติม
            </Label>
            <Textarea name="note" placeholder="รายละเอียดนัดหมาย..." />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <SubmitButton isPending={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending}>
      {isPending ? "กำลังบันทึก..." : "บันทึกนัดหมาย"}
    </Button>
  );
}
