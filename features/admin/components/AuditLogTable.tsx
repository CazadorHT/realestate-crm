"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { AuditLogWithUser } from "../queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { getReadableSummary } from "@/lib/audit-utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { toast } from "sonner";

interface AuditLogTableProps {
  data: AuditLogWithUser[];
}

export function AuditLogTable({ data }: AuditLogTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* 🖥️ Desktop Table View */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 border-b border-slate-100">
              <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {isEn ? "Time" : "เวลา"}
              </TableHead>
              <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {isEn ? "User" : "ผู้ใช้งาน"}
              </TableHead>
              <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {isEn ? "Event" : "กิจกรรม"}
              </TableHead>
              <TableHead className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {isEn ? "Activity Summary" : "รายละเอียดกิจกรรม"}
              </TableHead>
              <TableHead className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                {isEn ? "Actions" : "จัดการ"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                  {isEn ? "No audit log records found" : "ไม่พบข้อมูลประวัติการใช้งาน"}
                </TableCell>
              </TableRow>
            ) : (
              data.map((log) => (
                <TableRow
                  key={log.id}
                  className="group hover:bg-slate-50/50 transition-all duration-200 border-b border-slate-50 last:border-0"
                >
                  <TableCell className="px-6 py-4 text-[11px] text-slate-500 whitespace-nowrap font-semibold">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div
                      onClick={() => {
                        if (log.user?.id) {
                          setNavigatingId(log.id);
                          router.push(`/protected/settings/users/${log.user.id}`);
                        }
                      }}
                      className="flex items-center gap-3 w-fit group/user transition-all cursor-pointer relative"
                    >
                      {navigatingId === log.id && (
                        <div className="absolute -left-5 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        </div>
                      )}
                      <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover/user:ring-blue-200 transition-all">
                        <AvatarImage src={log.user?.avatar_url || ""} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-semibold">
                          {log.user?.full_name?.substring(0, 2).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px] group-hover/user:text-blue-600 transition-colors">
                          {log.user?.full_name || (isEn ? "Unknown" : "ไม่ระบุชื่อ")}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <FormatActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                        {getReadableSummary(log)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-tighter">
                          {log.entity}
                        </span>
                        {log.entity_id && (
                          <span className="text-[10px] text-slate-300 font-mono">
                            ID: {log.entity_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6 py-4">
                    <AuditLogDetailsDialog log={log} isEn={isEn} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 📱 Mobile Card View */}
      <div className="lg:hidden divide-y divide-slate-100 bg-white">
        {data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold italic">
            {isEn ? "No audit log records found" : "ไม่พบข้อมูลประวัติการใช้งาน"}
          </div>
        ) : (
          data.map((log) => (
            <div key={log.id} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                    <AvatarImage src={log.user?.avatar_url || ""} />
                    <AvatarFallback className="bg-slate-50 text-slate-400 text-[11px] font-semibold">
                      {log.user?.full_name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-[9px]">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                    <span 
                      onClick={() => {
                        if (log.user?.id) {
                          setNavigatingId(`m-${log.id}`);
                          router.push(`/protected/settings/users/${log.user.id}`);
                        }
                      }}
                      className="text-sm font-semibold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors relative"
                    >
                      {navigatingId === `m-${log.id}` && (
                        <div className="absolute -left-5 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        </div>
                      )}
                      {log.user?.full_name || (isEn ? "Unknown" : "ไม่ระบุชื่อ")}
                    </span>
                  </div>
                </div>
                <AuditLogDetailsDialog log={log} isEn={isEn} />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <FormatActionBadge action={log.action} />
                  <span className="px-2 py-0.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono font-semibold text-slate-400 uppercase">
                    {log.entity}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                  {getReadableSummary(log)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AuditLogDetailsDialog({ log, isEn }: { log: AuditLogWithUser; isEn: boolean }) {
  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify(log.metadata, null, 2));
    toast.success(isEn ? "Technical metadata copied to clipboard" : "คัดลอกข้อมูลทางเทคนิคแล้ว");
  };

  return (
    <ResponsiveDialog
      title={isEn ? "Audit Log Details" : "รายละเอียดประวัติ"}
      description={
        isEn
          ? "Technical metadata and context payload recorded by the surveillance service"
          : "ข้อมูลทางเทคนิคและสถานะของกิจกรรมที่เกิดขึ้นในระบบเฝ้าระวัง"
      }
      trigger={
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition-all active:scale-90 lg:h-8 lg:w-8">
          <Eye className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
        </Button>
      }
    >
      <div className="space-y-6 p-6">
        {/* Condensed Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 rounded-[32px] bg-slate-50/50 border border-slate-100">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {isEn ? "Action" : "การดำเนินการ"}
            </span>
            <span className="text-sm font-semibold text-slate-700">{log.action}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {isEn ? "Entity" : "หมวดหมู่"}
            </span>
            <span className="text-sm font-semibold text-slate-700">{log.entity}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {isEn ? "Triggered By" : "ผู้ทำรายการ"}
            </span>
            <span className="text-sm font-semibold text-slate-700">{log.user?.full_name} ({log.user?.role})</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {isEn ? "Timestamp" : "วันเวลา"}
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
            </span>
          </div>
        </div>

        {/* Technical Raw Data */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {isEn ? "Raw Metadata" : "ข้อมูลเชิงเทคนิค"}
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="rounded-[32px] bg-slate-950 p-6 shadow-xl overflow-hidden border border-slate-800">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              <pre className="text-[11px] text-blue-400 font-mono leading-relaxed">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 px-1">
          <p className="text-[10px] text-slate-400 font-semibold italic">
            Log ID: {log.id}
          </p>
          <Button 
            variant="ghost" 
            onClick={handleCopyRaw}
            className="h-8 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-blue-600"
          >
            {isEn ? "Copy Raw Metadata" : "คัดลอกข้อมูลทางเทคนิค"}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function FormatActionBadge({ action }: { action: string }) {
  let color = "bg-slate-100 text-slate-800";

  if (action.includes("create")) color = "bg-green-100 text-green-800";
  if (action.includes("update")) color = "bg-blue-100 text-blue-800";
  if (action.includes("delete")) color = "bg-red-100 text-red-800";
  if (action.includes("upload")) color = "bg-purple-100 text-purple-800";

  return (
    <Badge variant="secondary" className={`font-mono font-normal ${color}`}>
      {action}
    </Badge>
  );
}

