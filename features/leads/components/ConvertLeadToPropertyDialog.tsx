"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Building2, 
  Home, 
  UserCheck, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Phone, 
  Mail, 
  Layers,
  FileText,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { convertLeadToOwnerAction } from "../convert-lead-to-owner-action";

interface ConvertLeadToPropertyDialogProps {
  lead: {
    id: string;
    full_name: string;
    phone: string | null;
    line_id: string | null;
    email: string | null;
    note: string | null;
    preferred_property_types?: string[] | null;
    utm_data?: any;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConvertLeadToPropertyDialog({
  lead,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ConvertLeadToPropertyDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const router = useRouter();

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);

  // Extract preview information
  const note = lead.note || "";
  const imageMatch = note.match(/Image:\s*(https?:\/\/[^\s\n\r]+)/i) || note.match(/(https?:\/\/[^\s\n\r]+\.(?:jpg|jpeg|png|webp|heic))/i);
  const imageUrl = imageMatch && imageMatch[1] && imageMatch[1].trim() !== "-" ? imageMatch[1].trim() : null;

  const propertyType = lead.preferred_property_types?.[0] || lead.utm_data?.property_type || "CONDO";

  const [isOwnerOnlyLoading, setIsOwnerOnlyLoading] = useState(false);

  const handleConvert = async (createPropertyImmediately: boolean) => {
    if (createPropertyImmediately) {
      setIsLoading(true);
    } else {
      setIsOwnerOnlyLoading(true);
    }

    try {
      const result = await convertLeadToOwnerAction(lead.id);
      if (!result.success || !result.ownerId) {
        toast.error(result.message || (isEn ? "Failed to convert lead" : "ไม่สามารถแปลงข้อมูลได้"));
        return;
      }

      toast.success(
        isEn
          ? `Successfully converted to Owner (K. ${result.leadData?.ownerName}) ✨`
          : `แปลงเป็นเจ้าของทรัพย์ (K. ${result.leadData?.ownerName}) เรียบร้อยแล้ว ✨`
      );

      setIsOpen(false);

      if (createPropertyImmediately) {
        // Store prefill state for PropertyForm in sessionStorage
        if (typeof window !== "undefined") {
          const prefillPayload = {
            ownerId: result.ownerId,
            leadId: lead.id,
            propertyType: result.leadData?.propertyType || propertyType,
            description: result.leadData?.details || "",
            title: result.leadData?.titleSuggestion || "",
            imageUrl: result.leadData?.imageUrl || imageUrl,
            ownerName: result.leadData?.ownerName || lead.full_name,
          };
          sessionStorage.setItem("lead_deposit_prefill", JSON.stringify(prefillPayload));
        }

        // Navigate to Add Property Form with query parameters
        const queryParams = new URLSearchParams({
          owner_id: result.ownerId,
          from_lead: lead.id,
          property_type: result.leadData?.propertyType || propertyType,
        });

        router.push(`/protected/properties/new?${queryParams.toString()}`);
      } else {
        // Redirect to Owners list
        router.push("/protected/owners");
      }
    } catch (error: any) {
      console.error("Convert lead error:", error);
      toast.error(error?.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาดในการทำงาน"));
    } finally {
      setIsLoading(false);
      setIsOwnerOnlyLoading(false);
    }
  };

  const isBusy = isLoading || isOwnerOnlyLoading;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger !== undefined ? (
        trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null
      ) : (
        <DialogTrigger asChild>
          <Button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white h-12 px-5 text-sm font-semibold shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>{isEn ? "Convert & Create Property" : "รับฝากทรัพย์ / สร้างประกาศ"}</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {isEn ? "Convert Lead to Property Owner" : "แปลงลีดเป็นเจ้าของทรัพย์ (Owner)"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isEn 
                  ? "Save this lead into the Property Owners directory and optionally create a property listing." 
                  : "ระบบจะบันทึกข้อมูลลีดรายนี้เป็นเจ้าของทรัพย์ (Owner) ในระบบ โดยคุณสามารถเลือกบันทึกไว้ก่อน หรือไปสร้างประกาศทันทีได้"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Owner Info Summary Card */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isEn ? "New Owner Profile" : "ข้อมูลเจ้าของทรัพย์ที่จะสร้าง"}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="font-bold text-slate-900">K. {lead.full_name}</div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" /> {lead.phone}
                  </span>
                )}
                {lead.line_id && (
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-emerald-600">Line:</span> {lead.line_id}
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" /> {lead.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Property Pre-fill Summary */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" />
              <span>{isEn ? "Property Pre-fill Details" : "ข้อมูลทรัพย์สินที่จะนำเข้าฟอร์ม"}</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isEn ? "Property Type:" : "ประเภทอสังหาฯ:"}</span>
                <span className="font-bold bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                  {propertyType}
                </span>
              </div>
              {imageUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative h-12 w-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <img src={imageUrl} alt="Attached property" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                    {isEn ? "1 photo ready to import" : "มีรูปภาพ 1 รูปพร้อมนำเข้า"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isBusy}
            className="rounded-xl order-3 sm:order-1 sm:mr-auto"
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleConvert(false)}
            disabled={isBusy}
            className="rounded-xl border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-emerald-600 font-semibold gap-1.5 order-2 cursor-pointer"
          >
            {isOwnerOnlyLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{isEn ? "Saving..." : "กำลังบันทึก..."}</span>
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>{isEn ? "Save as Owner Only" : "ย้ายเป็น Owner ไว้ก่อน"}</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={() => handleConvert(true)}
            disabled={isBusy}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md shadow-emerald-600/20 order-1 sm:order-3 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEn ? "Processing..." : "กำลังดำเนินการ..."}</span>
              </>
            ) : (
              <>
                <span>{isEn ? "Create Property Now" : "สร้างประกาศทันที"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
