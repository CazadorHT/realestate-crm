"use client";

import { useState } from "react";
import {
  searchGlobalLeadAction,
  requestLeadTransferAction,
} from "@/features/leads/actions/cross-tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Search, ArrowLeftRight, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/components/providers/TenantProvider";

export default function CrossBranchTestPage() {
  const { activeTenant } = useTenant();
  const [phone, setPhone] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!phone) return toast.error("กรุณากรอกเบอร์โทรศัพท์");

    setIsSearching(true);
    try {
      const result = await searchGlobalLeadAction({ phone });
      if (result.success) {
        setSearchResult(result.data);
        if (result.data.found) {
          toast.warning("พบข้อมูลลูกค้าในระบบส่วนกลาง!");
        } else {
          toast.success("ไม่พบข้อมูลซ้ำ สามารถสร้างลีดใหม่ได้");
        }
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("ล้มเหลวในการตรวจสอบ");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ระบบแชร์ข้อมูลข้ามสาขา (Cross-Branch)
        </h1>
        <p className="text-muted-foreground">
          ทดสอบระบบตรวจสอบลูกค้าซ้ำข้ามสาขา และระบบส่งต่อลีด
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Global Lookup */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Search className="h-5 w-5" />
              1. ตรวจสอบลูกค้าข้ามสาขา
            </CardTitle>
            <CardDescription>
              เช็คเบอร์โทรลูกค้าจากคลังข้อมูลทุกสาขา
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="กรอกเบอร์โทรศัพท์..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "กำลังเช็ค..." : "ตรวจสอบ"}
              </Button>
            </div>

            {searchResult?.found && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  พบลูกค้าซ้ำ!
                </div>
                <div className="text-sm text-amber-700">
                  <p>
                    <strong>ชื่อ (Masked):</strong> {searchResult.maskedName}
                  </p>
                  <p>
                    <strong>อยู่สาขา:</strong> {searchResult.branchName}
                  </p>
                  <p>
                    <strong>ผู้ดูแล:</strong>{" "}
                    {searchResult.agentName || "ยังไม่ได้มอบหมาย"}
                  </p>
                </div>
                <p className="text-xs text-amber-600 italic">
                  * ข้อมูลชื่อถูกซ่อนบางส่วนเพื่อความเป็นส่วนตัวตาม PDPA
                </p>
              </div>
            )}

            {searchResult && !searchResult.found && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-green-800 animate-in fade-in">
                <UserCheck className="h-4 w-4" />
                เบอร์นี้ยังไม่มีในระบบส่วนกลาง (ปลอดภัย)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Transfer (Visual Demo) */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent-foreground">
              <ArrowLeftRight className="h-5 w-5" />
              2. ส่งต่อลีดข้ามสาขา (Concept)
            </CardTitle>
            <CardDescription>
              ส่งต่อข้อมูลลูกค้าให้สาขาที่ใกล้เคียงดูแล
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <ArrowLeftRight className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground px-4">
              ระบบกำลังพัฒนา UI สำหรับกดส่งต่อแบบ 100% แต่ตอนนีคุณสามารถใช้
              Action{" "}
              <code className="bg-muted px-1">requestLeadTransferAction</code>
              ผ่านโค้ดได้แล้วครับ
            </p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💡 ทำไมต้องมีระบบนี้?</h3>
          <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
            <li>
              <strong>ป้องกันพนักงานแย่งเคส:</strong> ถ้ารู้ว่ามีคนดูแลอยู่แล้ว
              จะได้ประสานงานกันแทน
            </li>
            <li>
              <strong>Data Privacy:</strong> โชว์ข้อมูลแค่บางส่วน (S***i)
              เพื่อให้รู้ว่าซ้ำแต่ไม่ละเมิดสิทธิ์
            </li>
            <li>
              <strong>Collaboration:</strong>{" "}
              สาขากรุงเทพสามารถส่งเคสให้สาขาภูเก็ตดูแลได้ผ่านระบบ
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
