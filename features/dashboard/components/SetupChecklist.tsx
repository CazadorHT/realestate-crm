"use client";

import { CheckCircle2, Circle, ArrowRight, Building2, UserPlus, PlusCircle, MessageSquare, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SetupProgress } from "../executive-queries";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface SetupChecklistProps {
  progress: SetupProgress;
}

export function SetupChecklist({ progress }: SetupChecklistProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  if (progress.isAllCompleted) return null;

  const percentage = Math.round((progress.completedCount / progress.totalSteps) * 100);

  const steps = [
    {
      id: "profile",
      title: isEn ? "Set Up Branch Profile" : "ตั้งค่าโปรไฟล์สาขา",
      description: isEn ? "Add logo, company details, and contact info to build client trust." : "ใส่โลโก้ ชื่อบริษัท และข้อมูลติดต่อเพื่อสร้างความน่าเชื่อถือ",
      completed: progress.profileCompleted,
      icon: Building2,
      href: "/protected/settings",
      color: "blue",
    },
    {
      id: "staff",
      title: isEn ? "Add First Team Member" : "เพิ่มพนักงานคนแรก",
      description: isEn ? "Invite your team to collaborate and manage deals together." : "ชวนทีมงานของคุณเข้าระบบเพื่อช่วยกันจัดการงาน",
      completed: progress.firstAgentAdded,
      icon: UserPlus,
      href: "/protected/settings/branches",
      color: "emerald",
    },
    {
      id: "property",
      title: isEn ? "Create First Property" : "ลงประกาศทรัพย์แรก",
      description: isEn ? "Start publishing your listings to attract potential buyers." : "เริ่มสร้าง Listing ของคุณเพื่อให้ลูกค้าเห็น",
      completed: progress.firstPropertyAdded,
      icon: PlusCircle,
      href: "/protected/properties/new",
      color: "indigo",
    },
    {
      id: "line",
      title: isEn ? "Connect LINE OA" : "เชื่อมต่อ LINE OA",
      description: isEn ? "Enable automated customer engagement and LINE alerts." : "เปิดระบบตอบกลับอัตโนมัติและแจ้งเตือนผ่าน LINE",
      completed: progress.lineConnected,
      icon: MessageSquare,
      href: "/protected/line-manager",
      color: "purple",
    },
  ];

  return (
    <Card className="border-0 shadow-xl bg-linear-to-br from-indigo-50 via-white to-blue-50 overflow-hidden relative group">
      {/* Background Decorative Sparkle */}
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Sparkles className="h-16 w-16 text-indigo-600" />
      </div>

      <CardHeader className="pb-4 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              {isEn ? "Getting Started (Setup Checklist)" : "เริ่มต้นใช้งาน (Setup Checklist)"}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {isEn ? "Complete these initial steps to fully configure your workspace." : "ทำตามขั้นตอนเหล่านี้เพื่อให้ระบบทำงานได้อย่างสมบูรณ์แบบ"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 xs:gap-4">
            <div className="text-right">
              <p className="text-xs xs:text-sm font-bold text-slate-900">{percentage}%</p>
              <p className="text-[10px] text-slate-500">{progress.completedCount}/{progress.totalSteps}</p>
            </div>
            <div className="w-24 xs:w-32 h-2.5 xs:h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0">
              <div 
                className="h-full bg-linear-to-r from-indigo-500 to-blue-500 transition-all duration-1000 shadow-sm"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div 
              key={step.id}
              className={cn(
                "relative p-5 rounded-2xl transition-all duration-300 border-2",
                step.completed 
                  ? "bg-white/40 border-slate-100 opacity-60" 
                  : "bg-white shadow-sm hover:shadow-md hover:-translate-y-1 border-indigo-100/50"
              )}
            >
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                    step.completed 
                      ? "bg-slate-100 text-slate-400" 
                      : cn(
                          step.color === "blue" && "bg-blue-100 text-blue-600",
                          step.color === "emerald" && "bg-emerald-100 text-emerald-600",
                          step.color === "indigo" && "bg-indigo-100 text-indigo-600",
                          step.color === "purple" && "bg-purple-100 text-purple-600",
                        )
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className={cn(
                      "font-bold text-base flex items-center gap-2",
                      step.completed ? "text-slate-400 line-through" : "text-slate-900"
                    )}>
                      {step.title}
                      {step.completed && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {!step.completed ? (
                  <Button 
                    asChild 
                    size="sm" 
                    className={cn(
                      "w-full text-white font-bold rounded-xl shadow-md cursor-pointer",
                      step.color === "blue" && "bg-blue-600 hover:bg-blue-700",
                      step.color === "emerald" && "bg-emerald-600 hover:bg-emerald-700",
                      step.color === "indigo" && "bg-indigo-600 hover:bg-indigo-700",
                      step.color === "purple" && "bg-purple-600 hover:bg-purple-700",
                    )}
                  >
                    <Link href={step.href}>
                      {isEn ? "Proceed" : "ดำเนินการ"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="flex items-center justify-center py-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {isEn ? "Completed" : "สำเร็จแล้ว"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
