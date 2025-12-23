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
import { UserRoleBadge } from "./UserRoleBadge";
import { UserRoleSelect } from "./UserRoleSelect";
import { UserDeleteDialog } from "./UserDeleteDialog";
import { UsersFilters } from "./UsersFilters";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { type UserRole } from "@/lib/auth-shared";

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
      <UsersFilters
        onSearchChange={setSearchQuery}
        onRoleFilterChange={setRoleFilter}
      />

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
                    className="text-center py-8 text-muted-foreground"
                  >
                    ไม่พบผู้ใช้ที่ตรงกับการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  const canDelete =
                    (user.role === "AGENT" || user.role === "USER") &&
                    !isCurrentUser;

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "-"}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (คุณ)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        <UserRoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "d MMM yyyy", {
                          locale: th,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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

      <div className="text-sm text-muted-foreground text-center">
        แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
      </div>
    </div>
  );
}
