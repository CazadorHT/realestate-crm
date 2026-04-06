"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  History,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HistoryItem {
  id: string;
  created_at: string;
  status: string;
  error_message: string | null;
  retry_count: number | null;
  metadata: any;
  properties?: { title: string };
  line_groups?: { group_name: string };
}

interface HistoryListProps {
  initialHistory: HistoryItem[];
  totalCount: number;
  currentPage: number;
}

export function HistoryList({
  initialHistory,
  totalCount,
  currentPage,
}: HistoryListProps) {
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const { language } = useLanguage();

  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy HH:mm", {
        locale: language === "th" ? th : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  if (history.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          ยังไม่มีประวัติการแจ้งเตือน
        </h3>
        <p className="text-sm text-slate-500">
          ประวัติการส่งแจ้งเตือนอัตโนมัติจะปรากฏขึ้นที่นี่เมื่อระบบเริ่มทำงาน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="w-[180px]">วันที่/เวลา</TableHead>
              <TableHead>ทรัพย์ (Property)</TableHead>
              <TableHead>กลุ่มไลน์ (LINE Group)</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
              <TableHead className="text-center whitespace-nowrap">พยายามส่ง</TableHead>
              <TableHead className="text-right whitespace-nowrap">รายละเอียด</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDateTime(item.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
                    {item.properties?.title || "Unknown Property"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-500 truncate max-w-[150px]">
                    {item.line_groups?.group_name || "Unknown Group"}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {item.status === "SUCCESS" ? (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> สำเร็จ
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 gap-1 font-bold">
                      <XCircle className="w-3 h-3" /> ล้มเหลว
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="text-xs font-bold text-slate-500">
                    {item.retry_count && item.retry_count > 0 ? (
                      <span className={item.status === "ERROR" ? "text-amber-600" : "text-slate-400"}>
                        ครั้งที่ {item.retry_count + 1}
                      </span>
                    ) : (
                      <span className="text-slate-300">1</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {item.error_message ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium bg-rose-50 px-2 py-1 rounded-lg transition-colors">
                            <Info className="w-3 h-3" /> ดูสาเหตุ
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-none p-3 max-w-[300px]">
                          <p className="text-xs leading-relaxed">{item.error_message}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : item.metadata?.is_test ? (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold text-blue-500 border-blue-200">
                      Test Send
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        <PaginationControls
          totalCount={totalCount}
          pageSize={20}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}
