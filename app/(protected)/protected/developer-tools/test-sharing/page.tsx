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
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function CrossBranchTestPage() {
  const { activeTenant } = useTenant();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [phone, setPhone] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!phone) return toast.error(isEn ? "Please enter a phone number" : "กรุณากรอกเบอร์โทรศัพท์");

    setIsSearching(true);
    try {
      const result = await searchGlobalLeadAction({ phone });
      if (result.success) {
        setSearchResult(result.data);
        if (result.data.found) {
          toast.warning(isEn ? "Customer found in central database!" : "พบข้อมูลลูกค้าในระบบส่วนกลาง!");
        } else {
          toast.success(isEn ? "No duplicate found. Safe to create a new lead." : "ไม่พบข้อมูลซ้ำ สามารถสร้างลีดใหม่ได้");
        }
      } else {
        toast.error(result.error || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      }
    } catch (error) {
      toast.error(isEn ? "Verification failed" : "ล้มเหลวในการตรวจสอบ");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEn ? "Cross-Branch Data Sharing" : "ระบบแชร์ข้อมูลข้ามสาขา (Cross-Branch)"}
        </h1>
        <p className="text-muted-foreground">
          {isEn
            ? "Test cross-branch customer duplication checks and lead referral workflows"
            : "ทดสอบระบบตรวจสอบลูกค้าซ้ำข้ามสาขา และระบบส่งต่อลีด"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Global Lookup */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Search className="h-5 w-5" />
              {isEn ? "1. Cross-Branch Lead Check" : "1. ตรวจสอบลูกค้าข้ามสาขา"}
            </CardTitle>
            <CardDescription>
              {isEn
                ? "Verify customer phone number against all branch databases"
                : "เช็คเบอร์โทรลูกค้าจากคลังข้อมูลทุกสาขา"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={isEn ? "Enter phone number..." : "กรอกเบอร์โทรศัพท์..."}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={isSearching} className="cursor-pointer">
                {isSearching ? (isEn ? "Checking..." : "กำลังเช็ค...") : (isEn ? "Check" : "ตรวจสอบ")}
              </Button>
            </div>

            {searchResult?.found && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  {isEn ? "Duplicate Customer Found!" : "พบลูกค้าซ้ำ!"}
                </div>
                <div className="text-sm text-amber-700">
                  <p>
                    <strong>{isEn ? "Name (Masked):" : "ชื่อ (Masked):"}</strong> {searchResult.maskedName}
                  </p>
                  <p>
                    <strong>{isEn ? "Branch:" : "อยู่สาขา:"}</strong> {searchResult.branchName}
                  </p>
                  <p>
                    <strong>{isEn ? "Assigned Agent:" : "ผู้ดูแล:"}</strong>{" "}
                    {searchResult.agentName || (isEn ? "Unassigned" : "ยังไม่ได้มอบหมาย")}
                  </p>
                </div>
                <p className="text-xs text-amber-600 italic">
                  {isEn
                    ? "* Customer names are partially masked for privacy under PDPA regulations"
                    : "* ข้อมูลชื่อถูกซ่อนบางส่วนเพื่อความเป็นส่วนตัวตาม PDPA"}
                </p>
              </div>
            )}

            {searchResult && !searchResult.found && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-green-800 animate-in fade-in">
                <UserCheck className="h-4 w-4" />
                {isEn ? "This number does not exist in central DB (Safe to proceed)" : "เบอร์นี้ยังไม่มีในระบบส่วนกลาง (ปลอดภัย)"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Transfer (Visual Demo) */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent-foreground">
              <ArrowLeftRight className="h-5 w-5" />
              {isEn ? "2. Cross-Branch Lead Referral (Concept)" : "2. ส่งต่อลีดข้ามสาขา (Concept)"}
            </CardTitle>
            <CardDescription>
              {isEn ? "Refer customer leads to appropriate regional branches" : "ส่งต่อข้อมูลลูกค้าให้สาขาที่ใกล้เคียงดูแล"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <ArrowLeftRight className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground px-4">
              {isEn
                ? "UI for 1-click lead referral is in active development. You can now use the requestLeadTransferAction programmatically."
                : "ระบบกำลังพัฒนา UI สำหรับกดส่งต่อแบบ 100% แต่ตอนนีคุณสามารถใช้ Action requestLeadTransferAction ผ่านโค้ดได้แล้วครับ"}
            </p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">
            {isEn ? "💡 Why Cross-Branch Sharing?" : "💡 ทำไมต้องมีระบบนี้?"}
          </h3>
          <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
            <li>
              <strong>{isEn ? "Prevent lead collision: " : "ป้องกันพนักงานแย่งเคส: "}</strong>
              {isEn ? "Coordinate when an agent is already in contact with the client." : "ถ้ารู้ว่ามีคนดูแลอยู่แล้ว จะได้ประสานงานกันแทน"}
            </li>
            <li>
              <strong>Data Privacy: </strong>
              {isEn ? "Masks sensitive identifiers (e.g. S***i) to preserve confidentiality." : "โชว์ข้อมูลแค่บางส่วน (S***i) เพื่อให้รู้ว่าซ้ำแต่ไม่ละเมิดสิทธิ์"}
            </li>
            <li>
              <strong>Collaboration: </strong>
              {isEn ? "Allows Bangkok teams to seamlessly refer Phuket inquiries." : "สาขากรุงเทพสามารถส่งเคสให้สาขาภูเก็ตดูแลได้ผ่านระบบ"}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
