"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserRoleSelect } from "./UserRoleSelect";
import { UserDeleteDialog } from "./UserDeleteDialog";
import { type UserRole } from "@/lib/auth-shared";
import { formatDate } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

interface UsersTableProps {
  users: Profile[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">ยังไม่มีผู้ใช้ในระบบ</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Replaced UsersFilters component with inline implementation */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="ค้นหาสมาชิกทีมด้วยชื่อ หรือเบอร์โทร..."
            className="pl-10 w-full bg-white border-slate-200 focus:border-blue-500 h-11 rounded-xl transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 hidden md:block">
            บทบาท:
          </span>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-44 bg-white border-slate-200 h-11 rounded-xl focus:ring-blue-500/10">
              <SelectValue placeholder="เลือกบทบาท" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="ALL">ทุกบทบาท</SelectItem>
              <SelectItem value="ADMIN">ผู้ดูแลระบบ (Admin)</SelectItem>
              <SelectItem value="AGENT">เอเจนท์ (Agent)</SelectItem>
              <SelectItem value="USER">ผู้ใช้งาน (User)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-20 text-slate-400 font-medium italic"
                  >
                    ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  const canDelete =
                    (user.role === "AGENT" || user.role === "USER") &&
                    !isCurrentUser;

                  const initials =
                    user.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "??";

                  return (
                    <TableRow
                      key={user.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold leading-none">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                              {user.full_name || "ไม่มีชื่อ"}
                              {isCurrentUser && (
                                <span className="text-xs bg-blue-500 text-white py-1 px-2 rounded-full font-medium">
                                  ตัวคุณ
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-slate-400">
                              ID: {user.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {user.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <UserRoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs font-medium">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right py-4 pr-6">
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`/protected/settings/users/${user.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
                              title="ดูรายละเอียดโปรไฟล์"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <UserRoleSelect
                            userId={user.id}
                            currentRole={user.role}
                            disabled={isCurrentUser}
                          />
                          {canDelete && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <UserDeleteDialog
                                userId={user.id}
                                fullName={user.full_name}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
      </div>
    </div>
  );
}
