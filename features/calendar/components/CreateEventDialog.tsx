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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="สร้างนัดหมายใหม่"
      trigger={
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">เพิ่มนัดหมาย</span>
          <span className="sm:hidden">เพิ่ม</span>
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmit(formData);
        }}
        className="space-y-4 py-4 text-left"
      >
        <div className="grid gap-2">
          <Label htmlFor="leadId" className="flex items-center gap-2 text-slate-700 font-bold">
            <User className="h-4 w-4 text-blue-500" /> ลูกค้า (Lead)
          </Label>
          <Select name="leadId" required>
            <SelectTrigger className="h-10 rounded-xl border-slate-200">
              <SelectValue placeholder="เลือกลูกค้า..." />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="w-[--radix-select-trigger-width] max-h-[200px] overflow-y-auto rounded-xl"
            >
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id} className="py-2.5">
                  <span className="truncate block max-w-[280px] sm:max-w-[400px]">
                    {lead.full_name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="propertyId" className="flex items-center gap-2 text-slate-700 font-bold">
            <Building2 className="h-4 w-4 text-orange-500" /> ทรัพย์สิน
            (Optional)
          </Label>
          <Select name="propertyId" defaultValue="none">
            <SelectTrigger className="h-10 rounded-xl border-slate-200">
              <SelectValue placeholder="เลือกทรัพย์สิน..." />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="w-[--radix-select-trigger-width] max-h-[200px] overflow-y-auto rounded-xl"
            >
              <SelectItem value="none">ไม่ระบุ</SelectItem>
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id} className="py-2.5">
                  <span className="truncate block max-w-[280px] sm:max-w-[400px]">
                    {prop.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="activityType" className="flex items-center gap-2 text-slate-700 font-bold">
            <Briefcase className="h-4 w-4 text-indigo-500" /> ประเภทนัดหมาย
          </Label>
          <Select name="activityType" defaultValue="VIEWING">
            <SelectTrigger className="h-10 rounded-xl border-slate-200">
              <SelectValue placeholder="เลือกประเภท..." />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="w-[--radix-select-trigger-width] rounded-xl"
            >
              <SelectItem value="VIEWING" className="py-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span>เยี่ยมชมทรัพย์ (Viewing)</span>
                </div>
              </SelectItem>
              <SelectItem value="FOLLOW_UP" className="py-2.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-amber-500" />
                  <span>ติดตามผล / เจรจา (Follow up / Deal)</span>
                </div>
              </SelectItem>
              <SelectItem value="CALL" className="py-2.5">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <span>โทรศัพท์ (Call)</span>
                </div>
              </SelectItem>
              <SelectItem value="LINE_CHAT" className="py-2.5">
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
            <Label className="flex items-center gap-2 text-slate-700 font-bold">
              <Calendar className="h-4 w-4 text-green-500" /> วันที่
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 rounded-xl border-slate-200",
                    !date && "text-muted-foreground",
                  )}
                >
                  {date ? formatDate(date) : <span className="text-sm">เลือกวันที่</span>}
                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
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
            <Label htmlFor="time" className="flex items-center gap-2 text-slate-700 font-bold">
              <Clock className="h-4 w-4 text-purple-500" /> เวลา
            </Label>
            <Select name="time" required>
              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                <SelectValue placeholder="เลือกเวลา..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto rounded-xl">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time} className="py-2.5">
                    {time} น.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2 pb-4">
          <Label htmlFor="note" className="flex items-center gap-2 text-slate-700 font-bold">
            <StickyNote className="h-4 w-4 text-slate-500" /> บันทึกเพิ่มเติม
          </Label>
          <Textarea name="note" placeholder="รายละเอียดนัดหมาย..." className="rounded-xl border-slate-300 focus:ring-blue-500/10 min-h-[100px]" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl h-11 font-bold text-slate-500"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึกนัดหมาย"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
