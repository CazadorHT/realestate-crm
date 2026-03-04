import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  Users,
  Home,
  Link as LinkIcon,
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

export interface SetupProgress {
  hasBranchProfile: boolean;
  hasStaff: boolean;
  hasProperty: boolean;
  hasLead: boolean;
}

export function SetupChecklist({ progress }: { progress: SetupProgress }) {
  const steps = [
    {
      id: "branch",
      title: "ตั้งค่าโปรไฟล์สาขา",
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
      isComplete: progress.hasStaff,
      icon: Users,
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
      id: "lead",
      title: "สร้างรายชื่อลูกค้า (Lead)",
      description: "เริ่มบันทึกข้อมูลลูกค้าที่สนใจทรัพย์",
      href: "/protected/leads/new",
      isComplete: progress.hasLead,
      icon: LinkIcon, // Or a Line icon if preferred later
    },
  ];

  const completedSteps = steps.filter((s) => s.isComplete).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // If fully completed, we don't need to show the big checklist anymore
  if (completedSteps === totalSteps) return null;

  return (
    <Card className="border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-violet-50/50 shadow-sm relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="relative z-10 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-slate-800">
              ยินดีต้อนรับสู่ Real Estate CRM 🚀
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              ทำตามขั้นตอนเหล่านี้เพื่อเริ่มต้นใช้งานระบบให้เต็มประสิทธิภาพ
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 md:pr-4 rounded-xl shadow-sm border border-slate-100 min-w-[200px]">
            <div className="flex-1 px-2">
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-indigo-600">ความคืบหน้า</span>
                <span className="text-slate-600">{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2"
                indicatorClassName="bg-indigo-600"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link
                href={step.href}
                key={step.id}
                className={cn(
                  "group relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-start gap-3",
                  step.isComplete
                    ? "bg-slate-50/80 border-slate-200 hover:bg-slate-100"
                    : "bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5",
                )}
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      step.isComplete
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-indigo-100 text-indigo-600",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {step.isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                <div className="mt-1">
                  <h4
                    className={cn(
                      "font-semibold text-sm",
                      step.isComplete
                        ? "text-slate-500 line-through"
                        : "text-slate-800",
                    )}
                  >
                    {index + 1}. {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {!step.isComplete && (
                  <div className="mt-auto pt-2 flex items-center text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    เริ่มทำเลย <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
