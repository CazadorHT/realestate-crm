"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitInquiryAction } from "@/features/public/actions";
import { LeadState } from "@/features/public/types";
import { toast } from "sonner";
import { MessageSquare, Loader2, Send } from "lucide-react";

interface ContactAgentDialogProps {
  propertyId?: string;
  propertyTitle?: string;
  trigger?: React.ReactNode;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังส่งข้อมูล...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          ส่งข้อความ
        </>
      )}
    </Button>
  );
}

export function ContactAgentDialog({
  propertyId,
  propertyTitle,
  trigger,
}: ContactAgentDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LeadState>({});

  async function clientAction(formData: FormData) {
    const result = await submitInquiryAction({}, formData);
    if (result.success) {
      toast.success("ส่งข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะรีบติดต่อกลับครับ");
      setOpen(false);
      setState({}); // Reset state
    } else {
      toast.error(result.error || "ไม่สามารถส่งข้อมูลได้");
      setState(result);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full h-12 rounded-xl text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-lg transition-all hover:-translate-y-0.5">
            <MessageSquare className="w-5 h-5 mr-2" />
            สนใจทรัพย์นี้ / นัดชม
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>ติดต่อสอบถาม / นัดชม</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลเพื่อให้เจ้าหน้าที่ติดต่อกลับเกี่ยวกับทรัพย์:{" "}
            <span className="font-semibold text-slate-700">
              {propertyTitle}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form action={clientAction} className="space-y-4 py-2">
          <input type="hidden" name="propertyId" value={propertyId} />

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-right">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="กรุณากรอกชื่อของคุณ"
              className={
                state.errors?.fullName ? "border-red-500 bg-red-50" : ""
              }
              required
            />
            {state.errors?.fullName && (
              <p className="text-xs text-red-500">{state.errors.fullName[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-right">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="0xx-xxx-xxxx"
              className={state.errors?.phone ? "border-red-500 bg-red-50" : ""}
              required
            />
            {state.errors?.phone && (
              <p className="text-xs text-red-500">{state.errors.phone[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lineId" className="text-right">
              Line ID (ถ้ามี)
            </Label>
            <Input id="lineId" name="lineId" placeholder="ไอดีไลน์" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-right">
              ข้อความเพิ่มเติม
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="เช่น สนใจนัดชมวันเสาร์นี้, สอบถามราคาเพิ่มเติม..."
              rows={3}
            />
          </div>

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
