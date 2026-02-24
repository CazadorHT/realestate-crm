"use client";

import { useState, useEffect } from "react";
import { useSocialPostEventListener } from "@/lib/social-post-events";
import { motion, AnimatePresence } from "framer-motion";
import {
  Facebook,
  Instagram,
  CheckCircle2,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Note: This is an example of a custom background monitor.
 * In a real-world scenario, you might use a Global State (Zustand/Context)
 * to track active background tasks.
 */

export interface SocialPostTask {
  id: string;
  propertyTitle: string;
  platform: "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK";
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
  message?: string;
}

export function SocialPostMonitor() {
  const [tasks, setTasks] = useState<SocialPostTask[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Listen to our custom social post events
  useSocialPostEventListener((data) => {
    if (data.type === "STARTED") {
      setTasks((prev) => [data.task, ...prev]);
      setIsMinimized(false); // Pop up if new task starts
    } else if (data.type === "FINISHED") {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === data.id
            ? { ...t, status: data.status, message: data.message }
            : t,
        ),
      );
    }
  });

  if (tasks.length === 0) return null;

  const activeCount = tasks.filter(
    (t) => t.status === "PROCESSING" || t.status === "PENDING",
  ).length;
  const successCount = tasks.filter((t) => t.status === "SUCCESS").length;

  return (
    <div className="fixed bottom-4 right-4 z-100 w-80">
      <AnimatePresence>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Loader2
                  className={cn(
                    "h-4 w-4 text-blue-500",
                    activeCount > 0 && "animate-spin",
                  )}
                />
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {activeCount > 0
                  ? `กำลังดำเนินการ ${activeCount} รายการ`
                  : `โพสต์สำเร็จแล้ว ${successCount} รายการ`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-red-500"
                onClick={() => setTasks([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Task List */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="max-h-60 overflow-y-auto"
              >
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 p-1.5 rounded-lg",
                          task.platform === "FACEBOOK"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-pink-50 text-pink-600",
                        )}
                      >
                        {task.platform === "FACEBOOK" ? (
                          <Facebook className="h-3.5 w-3.5" />
                        ) : (
                          <Instagram className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {task.propertyTitle}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {task.status === "PROCESSING"
                            ? "กำลังอัปโหลดรูปภาพและเนื้อหา..."
                            : task.message || "สำเร็จ"}
                        </p>
                      </div>
                      <div>
                        {task.status === "PROCESSING" ? (
                          <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                        ) : task.status === "SUCCESS" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
