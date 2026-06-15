"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  Users,
  Loader2,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  getLineFollowersCountAction,
  sendBroadcastAction,
  BroadcastSegment,
} from "../broadcast-actions";

export function BroadcastPanel() {
  const [segmentCounts, setSegmentCounts] = useState<Record<string, { total: number; valid: number }> | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<BroadcastSegment>("ALL");
  const [messageText, setMessageText] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadStats = async () => {
    setLoadingStats(true);
    const result = await getLineFollowersCountAction();
    if (result.success && result.data) {
      setSegmentCounts(result.data);
    } else {
      toast.error(result.message || "ไม่สามารถโหลดสถิติผู้ติดตามได้");
    }
    setLoadingStats(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSend = () => {
    if (!messageText.trim()) {
      toast.error("กรุณากรอกข้อความสำหรับบรอดแคสต์");
      return;
    }

    const targetLabel =
      selectedSegment === "ALL"
        ? "ผู้ติดตามทั้งหมด"
        : selectedSegment === "NEWSLETTER"
        ? "กลุ่มผู้สมัครรับข่าวสาร"
        : selectedSegment === "INQUIRY"
        ? "กลุ่มลูกค้าสนใจทรัพย์"
        : "กลุ่มลูกค้าฝากทรัพย์";

    const totalTarget = segmentCounts?.[selectedSegment]?.valid ?? 0;

    if (selectedSegment !== "ALL" && totalTarget === 0) {
      toast.error(`ไม่พบผู้ติดตามที่มี LINE User ID ตรงในกลุ่มเป้าหมาย ${targetLabel}`);
      return;
    }

    const confirmMsg =
      selectedSegment === "ALL"
        ? `คุณแน่ใจหรือไม่ที่จะส่งบรอดแคสต์หาผู้ติดตามทั้งหมดทาง LINE OA?`
        : `คุณแน่ใจหรือไม่ที่จะส่งข้อความหา ${targetLabel} จำนวน ${totalTarget} คน?`;

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      const result = await sendBroadcastAction(selectedSegment, messageText);
      if (result.success) {
        toast.success(result.message || "ส่งบรอดแคสต์สำเร็จเรียบร้อย!");
        setMessageText("");
        loadStats(); // Reload to update any counts
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการส่งบรอดแคสต์");
      }
    });
  };

  const currentStats = segmentCounts?.[selectedSegment] ?? { total: 0, valid: 0 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT: COMPOSER PANEL */}
      <Card className="lg:col-span-7 border-slate-200/60 bg-white/40 backdrop-blur-xl shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 font-sarabun">
                สร้างข้อความบรอดแคสต์ (Line Broadcast)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                เขียนเนื้อหาและเลือกกลุ่มผู้รับเพื่อยิงข้อความประชาสัมพันธ์ในครั้งเดียว
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Target Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              เลือกกลุ่มเป้าหมายผู้รับ (Target Audience)
            </label>
            <Select
              value={selectedSegment}
              onValueChange={(val) => setSelectedSegment(val as BroadcastSegment)}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white/80 shadow-xs focus:ring-2 focus:ring-indigo-500/20">
                <SelectValue placeholder="เลือกกลุ่มเป้าหมาย" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="py-2.5">
                  👥 ผู้ติดตามทาง LINE OA ทั้งหมด (Global Broadcast)
                </SelectItem>
                <SelectItem value="NEWSLETTER" className="py-2.5">
                  ✉️ เฉพาะผู้สมัครรับข่าวสาร (Newsletter Subscribers)
                </SelectItem>
                <SelectItem value="INQUIRY" className="py-2.5">
                  🏠 เฉพาะลูกค้าสนใจทรัพย์ (Property Inquirers)
                </SelectItem>
                <SelectItem value="DEPOSIT" className="py-2.5">
                  📂 เฉพาะลูกค้าฝากทรัพย์ (Property Depositors)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-600 font-medium">
                ขนาดเป้าหมายในฐานข้อมูล:
              </span>
            </div>
            <div className="flex items-center gap-2">
              {loadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <>
                  <Badge variant="outline" className="bg-white text-slate-700 font-bold border-slate-200">
                    มี Line ID: {currentStats.total} ราย
                  </Badge>
                  {selectedSegment !== "ALL" && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                      ยิงได้จริง: {currentStats.valid} ราย
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Warnings & Notices */}
          {selectedSegment !== "ALL" && currentStats.total > currentStats.valid && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100/50 flex gap-3 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="font-bold">ข้อมูลการติดต่อบางส่วนส่งไม่ถึง</p>
                <p className="text-amber-700/90 leading-relaxed">
                  มีผู้ใช้จำนวน {currentStats.total - currentStats.valid} รายที่ไม่ได้แอด Line OA เข้ามาคุยกับบอท (ให้เพียงแค่ LINE Username มา) ระบบจึงไม่สามารถส่ง API หาผู้ใช้กลุ่มนี้ได้โดยตรง
                </p>
              </div>
            </div>
          )}

          {/* Message Text Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              เนื้อหาข้อความ (Message Content)
            </label>
            <Textarea
              placeholder="พิมพ์ข้อความที่ต้องการส่งประชาสัมพันธ์ที่นี่..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-48 rounded-xl border-slate-200 bg-white/85 shadow-xs focus:ring-2 focus:ring-indigo-500/20 font-sarabun text-sm p-4 leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isPending || !messageText.trim()}
            className="w-full h-12 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-98"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังส่งบรอดแคสต์...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                เริ่มส่งบรอดแคสต์ทันที
              </>
            )}
          </Button>

        </CardContent>
      </Card>

      {/* RIGHT: PREVIEW PANEL */}
      <Card className="lg:col-span-5 border-slate-200/60 bg-slate-900 shadow-xl rounded-2xl overflow-hidden relative min-h-96">
        <div className="absolute top-0 inset-x-0 h-14 bg-slate-800/90 border-b border-slate-700/50 flex items-center px-4 justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-black text-white uppercase tracking-widest">
              LINE Screen Preview
            </span>
          </div>
          <Badge className="bg-[#00B900] text-white border-none text-[9px] font-bold">
            Chatbot Active
          </Badge>
        </div>

        <div className="pt-20 pb-6 px-4 space-y-4 h-[calc(100%-3.5rem)] flex flex-col justify-end">
          {messageText.trim() ? (
            <div className="flex items-start gap-2.5 animate-in slide-in-from-bottom-2 duration-300">
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-white text-[10px] font-bold border border-slate-600 shadow-sm">
                Bot
              </div>
              <div className="bg-[#85E185] text-slate-900 rounded-[18px] rounded-tl-[4px] px-4 py-2.5 max-w-[80%] text-xs font-medium font-sarabun whitespace-pre-wrap leading-relaxed shadow-sm">
                {messageText}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500">
              <Info className="h-8 w-8 mb-3 text-slate-600" />
              <p className="text-xs font-bold text-slate-400">ยังไม่มีข้อความ</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-relaxed">
                พิมพ์เนื้อหาทางด้านซ้ายเพื่อทดลองดูการจัดวางรูปแบบข้อความที่จะเด้งบนจอของลูกค้าจริง
              </p>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
