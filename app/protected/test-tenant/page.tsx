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

export default function TestTenantPage() {
  const { activeTenant, tenants, isLoading } = useTenant();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestAction = async () => {
    if (!activeTenant) {
      toast.error("กรุณาเลือกสาขาก่อน");
      return;
    }

    setIsTesting(true);
    try {
      const result = await createPropertySafe({
        tenantId: activeTenant.id,
        title: `ทรัพย์สินทดสอบสำหรับ ${activeTenant.name}`,
        price: 1000000,
      });

      if (result.success) {
        toast.success("สร้างทรัพย์สินในสาขานี้สำเร็จ!");
      } else {
        toast.error(`ดำเนินการไม่สำเร็จ: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
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
          ระบบทดสอบ Multi-Tenant
        </h1>
        <TenantSwitcher />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลสาขาที่เลือก</CardTitle>
            <CardDescription>ตรวจสอบสถานะ Context ปัจจุบัน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold text-slate-500">ชื่อสาขา:</span>{" "}
              {activeTenant?.name || "ไม่มี"}
            </div>
            <div>
              <span className="font-semibold text-slate-500">รหัส ID:</span>{" "}
              {activeTenant?.id || "ไม่มี"}
            </div>
            <div>
              <span className="font-semibold text-slate-500">Slug:</span>{" "}
              {activeTenant?.slug || "ไม่มี"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ทดสอบความปลอดภัย (Safe Action)</CardTitle>
            <CardDescription>ลองเขียนข้อมูลลงในสาขานี้</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              ปุ่มนี้จะเรียก Server Action ที่ถูกหุ้มด้วย{" "}
              <code>createSafeAction</code>
              ซึ่งจะสำเร็จก็ต่อเมื่อคุณเป็นสมาชิกของสาขาที่เลือกไว้ในฐานข้อมูลเท่านั้น
            </p>
            <Button
              onClick={handleTestAction}
              disabled={isTesting || !activeTenant}
              className="w-full"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ทดสอบสร้างทรัพย์สิน
            </Button>
          </CardContent>
        </Card>
      </div>

      {!activeTenant && tenants.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800">
          <p className="font-semibold">ไม่พบข้อมูลสาขา!</p>
          <p className="text-sm">
            คุณต้องเพิ่มตัวเองเข้าไปในตารางสมาชิก (tenant_members)
            ในฐานข้อมูลก่อน โดยรัน SQL script ที่ผมเตรียมไว้ให้ใน Supabase SQL
            Editor
          </p>
        </div>
      )}
    </div>
  );
}
