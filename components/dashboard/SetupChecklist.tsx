"use client";

import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  Users,
  Home,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { skipOnboardingStepAction } from "@/features/site-settings/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

export interface SetupProgress {
  hasBranchProfile: boolean;
  hasStaff: boolean;
  hasProperty: boolean;
  isLineConnected: boolean;
  isLineSkipped: boolean;
  isStaffSkipped: boolean;
}

export function SetupChecklist({ progress }: { progress: SetupProgress }) {
  const router = useRouter();
  const [isFullyComplete, setIsFullyComplete] = useState(false);

  const steps = [
    {
      id: "branch",
      title: "สร้างโปรไฟล์สาขา",
      description: "ใส่โลโก้และข้อมูลติดต่อสาขาเพื่อความน่าเชื่อถือ",
      href: "/protected/settings/branches",
      isComplete: progress.hasBranchProfile,
      icon: Building2,
    },
    {
      id: "staff",
      title: "เพิ่มพนักงานในทีม",
      description: "เชิญทีมงานของคุณเข้ามาช่วยจัดการระบบ",
      href: "/protected/settings/users",
      isComplete: progress.hasStaff || progress.isStaffSkipped,
      icon: Users,
      canSkip: !progress.hasStaff && !progress.isStaffSkipped,
      skipLabel: "เพิ่มทีหลัง",
    },
    {
      id: "property",
      title: "ลงประกาศทรัพย์แรก",
      description: "เพิ่มข้อมูลบ้าน คอนโด หรือที่ดินเข้าระบบ",
      href: "/protected/properties/new",
      isComplete: progress.hasProperty,
      icon: Home,
    },
    {
      id: "line",
      title: "เชื่อมต่อ Line OA",
      description: "เชื่อมต่อระบบตอบกลับอัตโนมัติและติดตามลูกค้า",
      href: "/protected/settings?tab=social",
      isComplete: progress.isLineConnected || progress.isLineSkipped,
      icon: MessageSquare,
      canSkip: !progress.isLineConnected && !progress.isLineSkipped,
      skipLabel: "ข้ามไปก่อน",
    },
  ];

  const completedSteps = steps.filter((s) => s.isComplete).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  useEffect(() => {
    if (completedSteps === totalSteps && !isFullyComplete) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#4f46e5", "#818cf8", "#c084fc", "#4ade80"],
        });
        setIsFullyComplete(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [completedSteps, totalSteps, isFullyComplete]);

  const handleSkip = async (e: React.MouseEvent, stepId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const type = stepId === "line" ? "line" : "staff";
      const result = await skipOnboardingStepAction(type);
      if (result.success) {
        toast.success("บันทึกข้อมูลเรียบร้อย");
        router.refresh();
      } else {
        toast.error("ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดกรุณาลองใหม่");
    }
  };

  // If fully completed and we've already celebrated, wait a bit or just hide
  // For now, let's keep it visible until the session is refreshed if they want to see the 100%
  if (isFullyComplete) {
    // Optionally return null or a "Congrats" card
  }

  // Still show 100% for a moment or until they navigate away
  if (completedSteps === totalSteps && isFullyComplete) return null;

  return (
    <Card className="border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-violet-50/50 shadow-sm relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="relative z-10 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
              ยินดีต้อนรับสู่ Real Estate CRM 🚀
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              ทำตามขั้นตอนเหล่านี้เพื่อเริ่มต้นใช้งานระบบให้เต็มประสิทธิภาพ
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 md:pr-4 rounded-xl shadow-sm border border-slate-100 min-w-[200px]">
            <div className="flex-1 px-2">
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-indigo-600 font-bold uppercase tracking-wider">
                  Setup Progress
                </span>
                <span className="text-slate-600">{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2 bg-slate-100"
                indicatorClassName="bg-linear-to-r from-indigo-600 to-violet-600 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isSkipped =
              (step.id === "line" && progress.isLineSkipped) ||
              (step.id === "staff" && progress.isStaffSkipped);

            return (
              <div
                key={step.id}
                className={cn(
                  "group relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-4",
                  step.isComplete
                    ? "bg-slate-50/80 border-slate-200 overflow-hidden"
                    : "bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1",
                )}
              >
                {/* Completed Stamp */}
                {step.isComplete && (
                  <div className="absolute top-2 right-2 opacity-10 rotate-12">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </div>
                )}

                <div className="flex items-start justify-between w-full relative z-10">
                  <div
                    className={cn(
                      "p-3 rounded-xl shadow-sm",
                      step.isComplete
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {step.isComplete ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                        {isSkipped ? "SKIPPED" : "DONE"}
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>

                <div className="relative z-10 w-full">
                  <h4
                    className={cn(
                      "font-bold text-sm",
                      step.isComplete ? "text-slate-400" : "text-slate-800",
                    )}
                  >
                    {index + 1}. {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 lines-2 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-auto w-full pt-2 relative z-10">
                  {!step.isComplete ? (
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={step.href}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        เริ่มเลย
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      {step.canSkip && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleSkip(e, step.id)}
                          className="text-[10px] h-8 text-slate-400 hover:text-slate-600 font-medium px-2"
                        >
                          {step.skipLabel}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="h-8 flex items-center">
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        เสร็จสมบูรณ์
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
