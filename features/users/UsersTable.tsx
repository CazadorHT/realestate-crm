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
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="ค้นหาสมาชิกทีมด้วยชื่อ หรือเบอร์โทร..."
            className="pl-10 w-full bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 h-11 rounded-xl transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
            บทบาท:
          </span>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200 h-11 rounded-xl focus:ring-blue-500/10">
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

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 px-6 font-bold text-slate-900">
                    ชื่อ-นามสกุล
                  </TableHead>
                  <TableHead className="py-4 px-6 font-bold text-slate-900">
                    เบอร์โทร
                  </TableHead>
                  <TableHead className="py-4 px-6 font-bold text-slate-900">
                    บทบาท
                  </TableHead>
                  <TableHead className="py-4 px-6 font-bold text-slate-900">
                    วันที่สร้าง
                  </TableHead>
                  <TableHead className="py-4 px-6 text-right font-bold text-slate-900">
                    การจัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-24 text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-10 w-10 text-slate-200" />
                        <p className="font-medium">
                          ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไข
                        </p>
                      </div>
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
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-100 shadow-sm ring-2 ring-white">
                              <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 flex items-center gap-2 truncate">
                                {user.full_name || "ไม่มีชื่อ"}
                                {isCurrentUser && (
                                  <span className="shrink-0 text-[10px] bg-blue-500 text-white py-0.5 px-2 rounded-full font-bold uppercase tracking-wider">
                                    ตัวคุณ
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {user.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 text-slate-600 font-medium">
                          {user.phone || (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6">
                          <UserRoleBadge role={user.role} />
                        </TableCell>
                        <TableCell className="px-6 text-slate-400 text-[11px] font-medium">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
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
                              <UserDeleteDialog
                                userId={user.id}
                                fullName={user.full_name}
                              />
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
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden space-y-4 animate-in fade-in duration-500">
        {filteredUsers.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-200">
            <CardContent className="py-20 text-center text-slate-400 italic">
              ไม่พบข้อมูลผู้ใช้
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => {
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
                <div
                  key={user.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                        <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {user.full_name || "ไม่มีชื่อ"}
                          </span>
                          {isCurrentUser && (
                            <span className="shrink-0 text-[10px] bg-blue-500 text-white py-0.5 px-2 rounded-full font-bold">
                              ตัวคุณ
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {user.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                    <UserRoleBadge role={user.role} />

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        เบอร์โทรศัพท์
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        {user.phone || "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        วันที่เข้าร่วม
                      </span>
                      <p className="text-xs font-medium text-slate-500">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50 mt-2">
                    <Link
                      href={`/protected/settings/users/${user.id}`}
                      className="block"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-11 px-4 text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>ดูรายละเอียด</span>
                      </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                      <UserRoleSelect
                        userId={user.id}
                        currentRole={user.role}
                        disabled={isCurrentUser}
                        className="flex-1 h-11 rounded-xl"
                      />
                      {canDelete && (
                        <UserDeleteDialog
                          userId={user.id}
                          fullName={user.full_name}
                          className="h-11 w-11 shrink-0 rounded-xl shadow-sm active:scale-95 transition-all"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 text-center font-medium bg-white/50 py-2 rounded-lg border border-slate-100 border-dashed">
        แสดง <span className="text-slate-900">{filteredUsers.length}</span> จาก{" "}
        <span className="text-slate-900">{users.length}</span> ผู้ใช้งานในระบบ
      </div>
    </div>
  );
}
