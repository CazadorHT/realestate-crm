"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Calendar,
  Users,
  Home,
  Trash2,
  Send,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  toggleRentNotificationRule,
  deleteRentNotificationRule,
  testSendRentNotification,
} from "@/features/rent-notifications/actions";
import { toast } from "sonner";
import { AddRuleDialog } from "./AddRuleDialog";

export function RuleList({ initialRules, groups, properties }: any) {
  const [rules, setRules] = useState(initialRules);
  const [editingRule, setEditingRule] = useState<any>(null);

  // Sync with server data when it changes (e.g. after router.refresh())
  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setRules((prev: any) =>
      prev.map((r: any) =>
        r.id === id ? { ...r, is_active: !currentStatus } : r,
      ),
    );

    const res = await toggleRentNotificationRule(id, !currentStatus);
    if (!res.success) {
      toast.error("Failed to update status");
      // Revert
      setRules((prev: any) =>
        prev.map((r: any) =>
          r.id === id ? { ...r, is_active: currentStatus } : r,
        ),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบการแจ้งเตือนนี้?")) return;

    const res = await deleteRentNotificationRule(id);
    if (res.success) {
      toast.success("ลบรายการแล้ว");
      setRules((prev: any) => prev.filter((r: any) => r.id !== id));
    } else {
      toast.error("ลบรายการไม่สำเร็จ");
    }
  };

  const handleTestSend = async (id: string) => {
    const toastId = toast.loading("กำลังส่งข้อความทดสอบ...");
    const res = await testSendRentNotification(id);
    if (res.success) {
      toast.success("ส่งข้อความทดสอบแล้ว", { id: toastId });
    } else {
      toast.error("เกิดข้อผิดพลาดในการส่ง: " + res.message, { id: toastId });
    }
  };

  if (rules.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-lg font-medium text-slate-700">
          ยังไม่มีการตั้งค่าแจ้งเตือน
        </p>
        <p className="text-sm">เริ่มสร้างการแจ้งเตือนแรกโดยกดปุ่มด้านบน</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ทรัพย์ (Property)</TableHead>
            <TableHead>กลุ่มไลน์ (LINE Group)</TableHead>
            <TableHead>วันแจ้งเตือน</TableHead>
            <TableHead>สิ้นสุดสัญญา</TableHead>
            <TableHead>ภาษา</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule: any) => (
            <TableRow key={rule.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {/* Use property image if available or icon */}
                    <Home className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 line-clamp-1">
                      {rule.properties?.title || "Unknown Property"}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    {rule.line_groups?.picture_url ? (
                      <img
                        src={rule.line_groups.picture_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <span
                    className="text-sm truncate max-w-[150px]"
                    title={rule.line_groups?.group_name}
                  >
                    {rule.line_groups?.group_name || "Unknown Group"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    ทุกวันที่ {rule.notification_day}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-slate-600">
                  {(() => {
                    const contracts =
                      rule.properties?.deals?.[0]?.rental_contracts || [];
                    const latestContract = contracts[0];
                    if (!latestContract?.end_date) return "-";
                    return new Date(latestContract.end_date).toLocaleDateString(
                      "th-TH",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    );
                  })()}
                </div>
              </TableCell>
              <TableCell>
                {rule.language === "en" ? (
                  <span
                    className="fi fi-us h-4 w-6 shadow-sm rounded-sm"
                    title="English"
                  />
                ) : rule.language === "cn" ? (
                  <span
                    className="fi fi-cn h-4 w-6 shadow-sm rounded-sm"
                    title="Chinese"
                  />
                ) : (
                  <span
                    className="fi fi-th h-4 w-6 shadow-sm rounded-sm"
                    title="Thai"
                  />
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleTestSend(rule.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      ส่งข้อความทดสอบ
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                      <Edit className="mr-2 h-4 w-4" /> แก้ไข
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      {editingRule && (
        <AddRuleDialog
          groups={groups}
          properties={properties}
          existingRule={editingRule}
          open={!!editingRule}
          onOpenChange={(open: boolean) => !open && setEditingRule(null)}
        />
      )}
    </>
  );
}
