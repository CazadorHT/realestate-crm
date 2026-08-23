"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Shield, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { AdminUserRow, updateUserRoleAction } from "@/features/admin/actions";
import { useLanguage } from "@/lib/i18n/language-context";

interface UsersTableProps {
  initialUsers: AdminUserRow[];
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [users, setUsers] = useState(initialUsers);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleRoleChange = async (
    userId: string,
    newRole: "USER" | "AGENT" | "ADMIN"
  ) => {
    setIsLoading(userId);
    try {
      await updateUserRoleAction(userId, newRole);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(isEn ? `Updated role to ${newRole}` : `อัปเดตบทบาทเป็น ${newRole} สำเร็จ`);
    } catch (error: any) {
      toast.error(error.message || (isEn ? "Failed to update role" : "เกิดข้อผิดพลาดในการอัปเดตบทบาท"));
    } finally {
      setIsLoading(null);
    }
  };

  const handleExport = () => {
    // Simple CSV Export
    const headers = [
      isEn ? "ID" : "รหัสผู้ใช้",
      isEn ? "Email" : "อีเมล",
      isEn ? "Full Name" : "ชื่อ-นามสกุล",
      isEn ? "Phone" : "เบอร์โทรศัพท์",
      isEn ? "Role" : "บทบาท",
      isEn ? "Created At" : "วันที่สมัคร",
    ];
    const rows = users.map((u) => [
      u.id,
      u.email || "",
      u.full_name || "",
      u.phone || "",
      u.role,
      u.created_at,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> {isEn ? "Export CSV" : "ส่งออก CSV"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isEn ? "User Info" : "ข้อมูลผู้ใช้"}</TableHead>
              <TableHead>{isEn ? "Role" : "บทบาท"}</TableHead>
              <TableHead>{isEn ? "Contact" : "ข้อมูลติดต่อ"}</TableHead>
              <TableHead>{isEn ? "Joined" : "วันที่เข้าร่วม"}</TableHead>
              <TableHead className="text-right">{isEn ? "Actions" : "การจัดการ"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user.full_name || (isEn ? "Unknown" : "ไม่ระบุชื่อ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "ADMIN"
                        ? "destructive"
                        : user.role === "AGENT"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{user.phone || "-"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString(isEn ? "en-US" : "th-TH")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={isLoading === user.id}
                      >
                        {isLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {isEn ? "Change Role" : "เปลี่ยนบทบาท"}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, "USER")}
                      >
                        {isEn ? "Set as USER" : "กำหนดเป็น USER"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, "AGENT")}
                      >
                        {isEn ? "Set as AGENT" : "กำหนดเป็น AGENT"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, "ADMIN")}
                      >
                        <Shield className="mr-2 h-4 w-4" /> {isEn ? "Set as ADMIN" : "กำหนดเป็น ADMIN"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

