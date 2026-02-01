"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface AdminTeamCardProps {
  currentRole: string;
  isViewingOwnProfile: boolean;
}

export function AdminTeamCard({
  currentRole,
  isViewingOwnProfile,
}: AdminTeamCardProps) {
  const isAdmin = currentRole === "ADMIN";

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>ทีมและการจัดการสิทธิ์</CardTitle>
              <CardDescription>คุณมีสิทธิ์ผู้ดูแลระบบ (Admin)</CardDescription>
            </div>
          </div>
          <Badge variant="default" className="bg-primary">
            ADMIN
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border border-primary/20 rounded-lg bg-background">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">จัดการผู้ใช้ในระบบ</p>
                <p className="text-sm text-muted-foreground mt-1">
                  เพิ่ม ลบ หรือแก้ไขข้อมูลผู้ใช้และสิทธิ์การเข้าถึง
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/protected/settings/users">
                ไปยังหน้าจัดการผู้ใช้
              </Link>
            </Button>
          </div>
        </div>

        {!isViewingOwnProfile && (
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">ลบบัญชีผู้ใช้</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm">
                ลบบัญชี
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
