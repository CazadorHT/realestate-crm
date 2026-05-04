"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Clock, 
  History,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Phone,
  Copy,
  ExternalLink,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import type { AgentTask } from "../../queries/agent-dashboard";
import { generateFollowUpScriptAction } from "../../actions/agent-actions";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentTaskBoardProps {
  tasks: AgentTask[];
}

export function AgentTaskBoard({ tasks }: AgentTaskBoardProps) {
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleGenAIScript = async (task: AgentTask) => {
    setSelectedTask(task);
    setIsGenerating(true);
    setGeneratedScript(null);
    setIsDialogOpen(true);

    try {
      const result = await generateFollowUpScriptAction(task.id, task.type as "STALE_LEAD" | "EXPIRING_CONTRACT");
      if (result.success && result.script) {
        setGeneratedScript(result.script);
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการเจนบทความ");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกไปยังคลิปบอร์ดแล้ว");
  };

  if (tasks.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">ยอดเยี่ยมมาก!</h3>
        <p className="text-slate-500 text-sm max-w-[200px]">
          ไม่มีงานด่วนหรือลูกค้าที่ค้างการติดต่อในตอนนี้
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          งานด่วนวันนี้
          <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h2>
        <Link href="/protected/calendar" className="text-xs font-bold text-blue-600 hover:underline">
          ดูปฏิทินทั้งหมด
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {tasks.map((task, i) => {
          const isHigh = task.priority === "HIGH";
          const isStale = task.type === "STALE_LEAD";
          
          return (
            <m.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300"
            >
              <Link
                href={task.link}
                className="absolute inset-0 z-0 rounded-3xl"
              />

              {/* Status Indicator */}
              <div className={cn(
                "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 relative z-10",
                isStale ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
              )}>
                {isStale ? <History className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                    isHigh ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {isHigh ? "ด่วนมาก" : "แจ้งเตือน"}
                  </span>
                  {task.ai_score && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Score: {task.ai_score}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: th })}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {task.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {task.description}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 relative z-10">
                {isStale && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleGenAIScript(task)}
                    className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-sm"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
                
                {task.phone && (
                  <a
                    href={`tel:${task.phone}`}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 shadow-sm transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}

                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </m.div>
          );
        })}
      </div>

      {/* AI Script Dialog */}
      <ResponsiveDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>สคริปต์แนะนำสำหรับคุณ {selectedTask?.customerName || "ลูกค้า"}</span>
          </div>
        }
        description={`บทสนทนาที่เหมาะสมสำหรับติดตามคุณ ${selectedTask?.title || "ลูกค้า"}`}
        isLoading={isGenerating}
        loadingText="AI กำลังร่างข้อความที่ดีที่สุดให้คุณ..."
      >
        <div className="p-6">
          {generatedScript ? (
            <div className="space-y-6">
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-medium">
                {generatedScript}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl h-12 font-bold gap-2"
                  onClick={() => copyToClipboard(generatedScript)}
                >
                  <Copy className="w-4 h-4" />
                  คัดลอกข้อความ
                </Button>
                {selectedTask?.line_id && (
                  <Button
                    className="rounded-2xl h-12 font-bold gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white border-none shadow-lg shadow-emerald-100"
                    onClick={() => {
                      window.open(`https://line.me/ti/p/~${selectedTask.line_id}`, "_blank");
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    ส่งเข้า Line
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              กำลังรอข้อความจาก AI...
            </div>
          )}
        </div>
      </ResponsiveDialog>
    </div>
  );
}
