"use client";

import { useTenant } from "@/components/providers/TenantProvider";
import { TenantSwitcher } from "@/components/common/TenantSwitcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { createPropertySafe } from "@/lib/actions/demo-tenant-action";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function TestTenantPage() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const { activeTenant, tenants, isLoading } = useTenant();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestAction = async () => {
    if (!activeTenant) {
      toast.error(isEn ? "Please select a branch first" : "กรุณาเลือกสาขาก่อน");
      return;
    }

    setIsTesting(true);
    try {
      const result = await createPropertySafe({
        tenantId: activeTenant.id,
        title: isEn ? `Test Property for ${activeTenant.name}` : `ทรัพย์สินทดสอบสำหรับ ${activeTenant.name}`,
        price: 1000000,
      });

      if (result.success) {
        toast.success(isEn ? "Created test property in this branch successfully!" : "สร้างทรัพย์สินในสาขานี้สำเร็จ!");
      } else {
        toast.error(isEn ? `Action failed: ${result.error}` : `ดำเนินการไม่สำเร็จ: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(isEn ? `Error: ${err.message}` : `เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEn ? "Multi-Tenant System Test" : "ระบบทดสอบ Multi-Tenant"}
        </h1>
        <TenantSwitcher />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEn ? "Selected Branch Info" : "ข้อมูลสาขาที่เลือก"}</CardTitle>
            <CardDescription>{isEn ? "Check current Context state" : "ตรวจสอบสถานะ Context ปัจจุบัน"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold text-slate-500">{isEn ? "Branch Name:" : "ชื่อสาขา:"}</span>{" "}
              {activeTenant?.name || (isEn ? "None" : "ไม่มี")}
            </div>
            <div>
              <span className="font-semibold text-slate-500">{isEn ? "Branch ID:" : "รหัส ID:"}</span>{" "}
              {activeTenant?.id || (isEn ? "None" : "ไม่มี")}
            </div>
            <div>
              <span className="font-semibold text-slate-500">Slug:</span>{" "}
              {activeTenant?.slug || (isEn ? "None" : "ไม่มี")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isEn ? "Security Test (Safe Action)" : "ทดสอบความปลอดภัย (Safe Action)"}</CardTitle>
            <CardDescription>{isEn ? "Test writing data under this branch" : "ลองเขียนข้อมูลลงในสาขานี้"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              {isEn
                ? "This button invokes a Server Action protected by createSafeAction, ensuring execution only succeeds if you are an authenticated member of this branch."
                : "ปุ่มนี้จะเรียก Server Action ที่ถูกหุ้มด้วย createSafeAction ซึ่งจะสำเร็จก็ต่อเมื่อคุณเป็นสมาชิกของสาขาที่เลือกไว้ในฐานข้อมูลเท่านั้น"}
            </p>
            <Button
              onClick={handleTestAction}
              disabled={isTesting || !activeTenant}
              className="w-full cursor-pointer"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEn ? "Test Create Property" : "ทดสอบสร้างทรัพย์สิน"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {!activeTenant && tenants.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800">
          <p className="font-semibold">{isEn ? "No branch memberships found!" : "ไม่พบข้อมูลสาขา!"}</p>
          <p className="text-sm">
            {isEn
              ? "You must add your identity to tenant_members in the database first."
              : "คุณต้องเพิ่มตัวเองเข้าไปในตารางสมาชิก (tenant_members) ในฐานข้อมูลก่อน โดยรัน SQL script ที่เตรียมไว้ให้ใน Supabase SQL Editor"}
          </p>
        </div>
      )}
    </div>
  );
}
