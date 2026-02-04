"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitInquiryAction } from "@/features/public/actions";
import { LeadState } from "@/features/public/types";
import { toast } from "sonner";
import {
  FaUser,
  FaPhoneAlt,
  FaLine,
  FaCommentDots,
  FaPaperPlane,
} from "react-icons/fa";
import { MdRealEstateAgent } from "react-icons/md";
import { Loader2 } from "lucide-react";

interface ContactAgentDialogProps {
  propertyId?: string;
  propertyTitle?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMessage?: string;
}

const QUICK_MESSAGES = [
  "สนใจนัดชมครับ/ค่ะ",
  "สอบถามราคาพิเศษ",
  "ขอข้อมูลเพิ่มเติม",
  "สนใจจอง",
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังส่งข้อมูล...
        </>
      ) : (
        <>
          <FaPaperPlane className="mr-2 h-4 w-4" />
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
  open: controlledOpen,
  onOpenChange,
  defaultMessage = "",
}: ContactAgentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, setState] = useState<LeadState>({});
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!isControlled) setInternalOpen(value);
  };

  // Auto-format phone number: xxx-xxx-xxxx
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  async function clientAction(formData: FormData) {
    if (propertyId === "preview-id") {
      // Mock success for Step 6 Preview
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("ส่งข้อมูลสำเร็จ (Preview Mode)");
      setOpen(false);
      return;
    }

    const result = await submitInquiryAction({}, formData);
    if (result.success) {
      toast.success("ส่งข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะรีบติดต่อกลับครับ");
      setOpen(false);
      setState({}); // Reset state
      setPhone(""); // Reset phone
      setMessage(""); // Reset message
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
            <FaCommentDots className="w-5 h-5 mr-2" />
            สนใจทรัพย์นี้ / นัดชม
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className=" bg-white p-0 overflow-hidden border-0 shadow-2xl rounded-2xl gap-0">
        {/* Header Section */}
        <div className="bg-linear-to-br from-blue-800 to-indigo-800 p-6 text-white relative overflow-hidden">
          {/* Abstract Background Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner border border-white/30">
              <MdRealEstateAgent className="w-8 h-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                ติดต่อสอบถาม
              </DialogTitle>
              <p className="text-blue-100 text-sm line-clamp-1 opacity-90">
                {propertyTitle || "สอบถามข้อมูลเพิ่มเติม"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form action={clientAction} className="space-y-5">
            <input type="hidden" name="propertyId" value={propertyId} />

            {/* Name & Phone Row */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="fullName"
                  className="text-slate-600 font-medium text-xs uppercase tracking-wider pl-1"
                >
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <FaUser className="w-4 h-4" />
                  </div>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="กรอกชื่อของคุณ"
                    className={`pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl transition-all ${
                      state.errors?.fullName ? "border-red-500 bg-red-50" : ""
                    }`}
                    required
                  />
                </div>
                {state.errors?.fullName && (
                  <p className="text-xs text-red-500 pl-1">
                    {state.errors.fullName[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-slate-600 font-medium text-xs uppercase tracking-wider pl-1"
                >
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <FaPhoneAlt className="w-4 h-4" />
                  </div>
                  <input
                    type="hidden"
                    name="phone"
                    value={phone.replace(/-/g, "")}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0xx-xxx-xxxx"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={12}
                    className={`pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl transition-all ${
                      state.errors?.phone ? "border-red-500 bg-red-50" : ""
                    }`}
                    required
                  />
                </div>
                {state.errors?.phone && (
                  <p className="text-xs text-red-500 pl-1">
                    {state.errors.phone[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="lineId"
                className="text-slate-600 font-medium text-xs uppercase tracking-wider pl-1"
              >
                Line ID (ถ้ามี)
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00B900] transition-colors">
                  <FaLine className="w-4.5 h-4.5" />
                </div>
                <Input
                  id="lineId"
                  name="lineId"
                  placeholder="ไอดีไลน์"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#00B900] rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="message"
                className="text-slate-600 font-medium text-xs uppercase tracking-wider pl-1"
              >
                ข้อความเพิ่มเติม
              </Label>

              {/* Quick Chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {QUICK_MESSAGES.map((msg) => (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => setMessage(msg)}
                    className="text-sm px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-colors"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <FaCommentDots className="w-4.5 h-4.5" />
                </div>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="พิมพ์ข้อความ..."
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="pl-10 resize-none bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl transition-all min-h-[80px]"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton />
              <p className="text-[10px] text-slate-400 text-center mt-3">
                เจ้าหน้าที่จะติดต่อกลับให้เร็วที่สุด (ภายใน 24 ชม.)
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
