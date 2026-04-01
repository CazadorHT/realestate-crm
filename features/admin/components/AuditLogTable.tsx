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
import Link from "next/link";

interface AuditLogTableProps {
  data: AuditLogWithUser[];
}

export function AuditLogTable({ data }: AuditLogTableProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="w-[160px]">เวลา</TableHead>
            <TableHead className="w-[200px]">ผู้ใช้งาน</TableHead>
            <TableHead className="w-[180px]">กิจกรรม</TableHead>
            <TableHead>รายละเอียดกิจกรรม (Summary)</TableHead>
            <TableHead className="text-right w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                ไม่พบข้อมูลประวัติการใช้งาน
              </TableCell>
            </TableRow>
          ) : (
            data.map((log) => (
              <TableRow
                key={log.id}
                className="group hover:bg-slate-50/30 transition-colors"
              >
                <TableCell className="text-[12px] text-muted-foreground whitespace-nowrap font-medium">
                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <Link
                    href={
                      log.user?.id
                        ? `/protected/settings/users/${log.user.id}`
                        : "#"
                    }
                    className="flex items-center gap-2 w-fit group/user transition-all"
                  >
                    <Avatar className="h-8 w-8 border border-slate-100 shadow-xs">
                      <AvatarImage src={log.user?.avatar_url || ""} />
                      <AvatarFallback className="bg-slate-50 text-slate-400 text-[10px] font-bold">
                        {log.user?.full_name?.substring(0, 2).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                        {log.user?.full_name || "Unknown"}
                      </span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <FormatActionBadge action={log.action} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-slate-700 font-medium">
                      {getReadableSummary(log)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
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
                <TableCell className="text-right">
                  <ResponsiveDialog
                    title="รายละเอียดประวัติการใช้งาน (Audit Log)"
                    description="ข้อมูลทางเทคนิคและสถานะของกิจกรรมที่เกิดขึ้นในระบบ"
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg">
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
                    }
                  >
                    <div className="space-y-6 pt-4">
                      {/* Condensed Meta Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</span>
                          <span className="text-sm font-bold text-slate-700">{log.action}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entity</span>
                          <span className="text-sm font-bold text-slate-700">{log.entity}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">User</span>
                          <span className="text-sm font-bold text-slate-700">{log.user?.full_name} ({log.user?.role})</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</span>
                          <span className="text-sm font-bold text-slate-700">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                          </span>
                        </div>
                      </div>

                      {/* Technical Raw Data */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Raw Metadata</span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="rounded-2xl bg-slate-950 p-5 shadow-inner overflow-hidden">
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <pre className="text-[11px] text-emerald-400 font-mono leading-relaxed">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <p className="text-[10px] text-slate-400 font-medium italic">
                          ID: {log.id}
                        </p>
                      </div>
                    </div>
                  </ResponsiveDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface AuditLogMetadata {
  email?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  title?: string;
  role?: string;
}

function getReadableSummary(log: AuditLogWithUser): string {
  const meta = log.metadata as unknown as AuditLogMetadata;
  const action = log.action;

  switch (action) {
    case "member.transfer":
      return `ย้ายพนักงาน ${meta.email || ""} ไปยังสาขาใหม่`;
    case "lead.transfer":
      return `ส่งต่อลูกค้าคุณ ${meta.fullName || "N/A"} ให้สาขาอื่นดูแล`;
    case "member.add":
      return `เพิ่มพนักงาน ${meta.email || ""} เข้าสู่สาขา (Role: ${meta.role || "N/A"})`;
    case "member.remove":
      return `ลบพนักงานออกจากสาขา`;
    case "tenant.create":
      return `สร้างสาขาใหม่: ${meta.name || "N/A"}`;
    case "tenant.update":
      return `แก้ไขข้อมูลสาขา: ${meta.name || "N/A"}`;
    case "tenant.delete":
      return `ลบสาขาออกจากระบบ`;
    case "property.create":
      return `เพิ่มทรัพย์สินใหม่: ${meta.title || "N/A"}`;
    case "property.update":
      return `อัปเดตข้อมูลทรัพย์สิน`;
    case "lead.create":
      return `เพิ่มลีดใหม่: ${meta.full_name || "N/A"}`;
    case "lead.update":
      return `อัปเดตข้อมูลลีด`;
    case "deal.create":
      return `สร้างดีลใหม่`;
    case "auth.login":
      return `เข้าสู่ระบบ`;
    default:
      if (action.includes("delete")) return `ลบข้อมูล (${log.entity})`;
      if (action.includes("create")) return `สร้างข้อมูลใหม่ (${log.entity})`;
      if (action.includes("status.update"))
        return `อัปเดตสถานะ (${log.entity})`;
      return action;
  }
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
