"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarEvent } from "../queries";
import {
  Calendar,
  Clock,
  FileText,
  User,
  Building2,
  Tag,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// Helper for formatting Thai currency
const formatThaiCurrency = (value: number): string => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

export function EventDetailsDialog({
  event,
  open,
  onClose,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const startDate = new Date(event.start);

  const getEventLabel = (type: string) => {
    switch (type) {
      case "viewing":
        return "นัดหมายชมทรัพย์";
      case "contract_start":
        return "เริ่มต้นสัญญา";
      case "contract_end":
        return "สัญญาหมดอายุ";
      case "early_termination":
        return "ยุติสัญญาก่อนกำหนด";
      case "deal_closing":
        return "ปิดดีล";
      default:
        return "กิจกรรม";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "viewing":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "contract_start":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "contract_end":
        return "text-red-600 bg-red-50 border-red-200";
      case "early_termination":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "deal_closing":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "viewing":
        return <User className="h-5 w-5 text-blue-600" />;
      case "contract_start":
        return <PlayCircle className="h-5 w-5 text-emerald-600" />;
      case "contract_end":
        return <StopCircle className="h-5 w-5 text-red-600" />;
      case "early_termination":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "deal_closing":
        return <Tag className="h-5 w-5 text-purple-600" />;
      default:
        return <Calendar className="h-5 w-5 text-slate-600" />;
    }
  };

  const isContractEvent =
    event.type === "contract_start" ||
    event.type === "contract_end" ||
    event.type === "early_termination";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={getEventColor(event.type)}>
              {getEventLabel(event.type)}
            </Badge>
          </div>
          <DialogTitle className="text-xl leading-relaxed">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 1. Time Section */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">วันและเวลา</p>
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  {formatDate(startDate)}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-3 w-3" />
                  {format(startDate, "HH:mm")} น.
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-2" />

          {/* 2. Contract Details (for contract events) */}
          {isContractEvent && event.meta && (
            <>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    รายละเอียดสัญญา
                  </p>
                  <div className="mt-2 space-y-2 text-sm">
                    {event.meta.contractNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">เลขที่สัญญา:</span>
                        <span className="font-medium text-slate-700">
                          {event.meta.contractNumber}
                        </span>
                      </div>
                    )}
                    {event.meta.leaseTermMonths && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">ระยะสัญญา:</span>
                        <span className="font-medium text-slate-700">
                          {event.meta.leaseTermMonths} เดือน
                        </span>
                      </div>
                    )}
                    {event.meta.rentPrice && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">ค่าเช่า:</span>
                        <span className="font-medium text-emerald-600">
                          {formatThaiCurrency(event.meta.rentPrice)}/เดือน
                        </span>
                      </div>
                    )}
                    {event.meta.startDate && event.meta.endDate && (
                      <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <PlayCircle className="h-3 w-3 text-emerald-500" />
                          เริ่ม: {formatDate(new Date(event.meta.startDate))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <StopCircle className="h-3 w-3 text-red-500" />
                          สิ้นสุด: {formatDate(new Date(event.meta.endDate))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-px bg-slate-100 my-2" />
            </>
          )}

          {/* 3. Lead / Client Section (if available) */}
          {event.meta?.leadId && (
            <>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    ลูกค้า (Lead)
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {event.title.replace("นัดชม: ", "")}
                  </p>
                </div>
              </div>
              <div className="h-px bg-slate-100 my-2" />
            </>
          )}

          {/* 4. Property Info */}
          {event.meta?.propertyTitle && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div className="w-full">
                <p className="text-sm font-semibold text-slate-900">
                  ทรัพย์สิน
                </p>
                <div className="mt-2 rounded-lg border overflow-hidden bg-slate-50">
                  {event.meta.propertyImage ? (
                    <div className="relative h-32 w-full">
                      <img
                        src={event.meta.propertyImage}
                        alt={event.meta.propertyTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 flex items-center justify-center text-xs text-slate-400">
                      ไม่มีรูปภาพ
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">
                      {event.meta.propertyTitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Details / Note based on Type */}
          {event.meta?.note && (
            <>
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-sm w-full">
                  <p className="font-semibold text-slate-900">
                    บันทึกช่วยจำ (Note)
                  </p>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg  text-slate-600 text-sm whitespace-pre-wrap">
                    {event.meta.note}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 6. Deal Type (for deal_closing) */}
          {event.type === "deal_closing" && event.meta?.type && (
            <div className="flex items-start gap-3 mt-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Banknote className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">ประเภทดีล</p>
                <p className="text-slate-600 mt-0.5">
                  {event.meta.type === "RENT" ? "เช่า" : "ขาย"}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
