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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
            <TableHead className="w-[180px]">เวลา</TableHead>
            <TableHead className="w-[280px]">ผู้ใช้งาน</TableHead>
            <TableHead>กิจกรรม (Action)</TableHead>
            <TableHead>หมวดหมู่ (Entity)</TableHead>
            <TableHead className="text-right">รายละเอียด</TableHead>
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
                    className="flex items-center gap-3 w-fit group/user transition-all"
                  >
                    <Avatar className="h-9 w-9 border border-slate-100 shadow-xs group-hover/user:ring-2 group-hover/user:ring-blue-500/20 group-hover/user:border-blue-200 transition-all">
                      <AvatarImage src={log.user?.avatar_url || ""} />
                      <AvatarFallback className="bg-slate-50 text-slate-400 text-xs font-bold">
                        {log.user?.full_name?.substring(0, 2).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 group-hover/user:text-blue-600 transition-colors">
                        {log.user?.full_name || "Unknown User"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {log.user?.email}
                      </span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <FormatActionBadge action={log.action} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs">{log.entity}</span>
                    {log.entity_id && (
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">
                        {log.entity_id}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>รายละเอียด Log</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold text-muted-foreground">
                              Action:
                            </span>{" "}
                            {log.action}
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground">
                              Entity:
                            </span>{" "}
                            {log.entity}
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground">
                              User:
                            </span>{" "}
                            {log.user?.full_name} ({log.user?.role})
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground">
                              Time:
                            </span>{" "}
                            {format(
                              new Date(log.created_at),
                              "dd/MM/yyyy HH:mm:ss",
                            )}
                          </div>
                        </div>
                        <div className="rounded-md bg-slate-950 p-4 overflow-x-auto">
                          <pre className="text-xs text-slate-50 font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
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
