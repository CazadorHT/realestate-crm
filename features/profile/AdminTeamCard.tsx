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
import { useLanguage } from "@/components/providers/LanguageProvider";

interface AdminTeamCardProps {
  currentRole: string;
  isViewingOwnProfile: boolean;
}

export function AdminTeamCard({
  currentRole,
  isViewingOwnProfile,
}: AdminTeamCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
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
              <CardTitle>
                {isEn ? "Team & Role Management" : "ทีมและการจัดการสิทธิ์"}
              </CardTitle>
              <CardDescription>
                {isEn ? "You have System Admin privileges (Admin)" : "คุณมีสิทธิ์ผู้ดูแลระบบ (Admin)"}
              </CardDescription>
            </div>
          </div>
          <Badge variant="default" className="bg-primary">
            ADMIN
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 ">
        <div className="p-4 border border-primary/20 rounded-lg bg-background">
          <div className="flex flex-col items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">
                  {isEn ? "Manage System Users" : "จัดการผู้ใช้ในระบบ"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEn
                    ? "Add, remove, or modify user profiles and access roles"
                    : "เพิ่ม ลบ หรือแก้ไขข้อมูลผู้ใช้และสิทธิ์การเข้าถึง"}
                </p>
              </div>
            </div>
            <div className="flex-1 w-full">
              <Button variant="outline" asChild className="w-full h-11">
                <Link href="/protected/settings/users">
                  {isEn ? "Go to User Management" : "ไปยังหน้าจัดการผู้ใช้"}
                </Link>
              </Button>
            </div>
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
                  <p className="font-medium text-destructive">
                    {isEn ? "Delete User Account" : "ลบบัญชีผู้ใช้"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEn ? "This action cannot be undone." : "การดำเนินการนี้ไม่สามารถย้อนกลับได้"}
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm">
                {isEn ? "Delete Account" : "ลบบัญชี"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
