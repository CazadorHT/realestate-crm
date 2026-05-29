"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BackgroundProcess, ProcessEvent } from "@/lib/process-monitor";
import { useTenant } from "./TenantProvider";
import { toast } from "sonner";

interface ProcessContextType {
  processes: BackgroundProcess[];
  activeCount: number;
  errorCount: number;
  clearFinished: () => void;
  deleteMultiple: (ids: string[]) => Promise<void>;
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

const STORAGE_KEY = "app_process_history";

export function ProcessProvider({ children }: { children: React.ReactNode }) {
  const [processes, setProcesses] = useState<BackgroundProcess[]>([]);
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id;

  // 🛡️ Load from Database on mount (Enterprise Persistence)
  useEffect(() => {
    const syncWithDB = async () => {
      try {
        const { getBackgroundTasksAction, autoPruneOldTasksAction, markStuckTasksAsErrorAction } = await import("@/lib/background-tasks/actions");
        
        // 🧹 Economical Cleanup: 
        // 1. Remove very old tasks (7+ days) 
        // 2. Mark stuck tasks (>2h) as ERROR
        await Promise.all([
          autoPruneOldTasksAction(),
          markStuckTasksAsErrorAction()
        ]);

        const res = await getBackgroundTasksAction();
        if (res.success && Array.isArray(res.data)) {
          const synced = res.data.map((task: any) => ({
            id: task.id,
            name: task.name,
            status: task.status as any,
            message: task.message,
            startedAt: new Date(task.created_at),
            completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
            type: task.type,
            payload: task.payload,
            resultLink: task.result_link,
            errorDetails: task.error_details,
          }));
          setProcesses(synced);
        }
      } catch (e) {
        console.error("Failed to sync background tasks from DB", e);
      }
    };
    syncWithDB();

    // ⚡ REALTIME: Listen for background task updates (Optimized by Tenant)
    const initRealtime = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const channel = supabase
        .channel(tenantId ? `system_task_queue_${tenantId}` : "system_task_queue_global")
        .on(
          "postgres_changes",
          { 
            event: "UPDATE", 
            schema: "public", 
            table: "system_task_queue"
          },
          (payload) => {
            const updatedTask = payload.new as any;
            const updatedPayload = updatedTask.payload && typeof updatedTask.payload === "object" ? (updatedTask.payload as any) : {};
            
            // Application-level tenant filter (Allow if global view, no tenant, or matching tenant)
            const isMatch = !tenantId || tenantId === "ALL" || updatedPayload.tenant_id === tenantId;
            if (!isMatch) return;
            
            window.dispatchEvent(
              new CustomEvent("app-process-event", {
                detail: {
                  type: "PROCESS_UPDATED",
                  id: updatedTask.id,
                  status: updatedTask.status,
                  message: updatedPayload.message || updatedTask.error_log || "",
                  resultLink: updatedPayload.result_link,
                  errorDetails: updatedTask.error_log || updatedPayload.error_details,
                },
              })
            );

            if (updatedTask.status === "SUCCESS") {
              toast.success(`สำเร็จ: ${updatedTask.task_name}`, {
                description: updatedPayload.message,
                action: updatedPayload.result_link ? {
                  label: "ดูผลลัพธ์",
                  onClick: () => window.open(updatedPayload.result_link, "_blank")
                } : undefined
              });
            }

            if (
              updatedTask.status === "SUCCESS" && 
              updatedPayload.type === "BLOG_GENERATION" && 
              updatedPayload.result
            ) {
              window.dispatchEvent(
                new CustomEvent("BLOG_AI_GENERATED_SUCCESS", { 
                  detail: updatedPayload.result 
                })
              );
            }

            if (
              (updatedTask.status === "ERROR" || updatedTask.status === "CANCELLED") && 
              updatedPayload.type === "BLOG_GENERATION"
            ) {
              window.dispatchEvent(new CustomEvent("BLOG_AI_GENERATION_ERROR"));
              const isCancelled = updatedTask.status === "CANCELLED";
              const errMsg = updatedTask.error_log || updatedPayload.message || "การทำงานถูกยกเลิก";
              if (isCancelled) {
                toast.error("การสร้างบทความถูกยกเลิกแล้ว");
              } else {
                toast.error(`สร้างบทความล้มเหลว: ${errMsg}`);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "system_task_queue"
          },
          (payload) => {
            const deletedId = (payload.old as any).id;
            if (deletedId) {
              setProcesses((prev) => prev.filter((p) => p.id !== deletedId));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = initRealtime();
    return () => {
      cleanup.then(fn => fn && (fn as any)());
    };
  }, [tenantId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const event = (e as CustomEvent<ProcessEvent>).detail;
      
      if (event.type === "PROCESS_STARTED") {
        setProcesses((prev) => [event.process, ...prev].slice(0, 50)); 
      } else if (event.type === "PROCESS_UPDATED") {
        setProcesses((prev) =>
          prev.map((p) =>
            p.id === event.id
              ? {
                  ...p,
                  status: event.status,
                  message: event.message,
                  resultLink: event.resultLink || p.resultLink,
                  errorDetails: event.errorDetails || p.errorDetails,
                  completedAt:
                    event.status === "SUCCESS" || event.status === "ERROR"
                      ? new Date()
                      : p.completedAt,
                }
              : p
          )
        );
      } else if (event.type === "PROCESSES_SYNCED") {
        setProcesses(event.processes);
      }
    };

    window.addEventListener("app-process-event", handler);
    return () => window.removeEventListener("app-process-event", handler);
  }, []);

  const clearFinished = useCallback(async () => {
    const finishedIds = processes
      .filter((p) => p.status === "SUCCESS" || p.status === "ERROR")
      .map((p) => p.id);
    
    if (finishedIds.length === 0) return;

    // 1. Update UI immediately
    setProcesses((prev) => 
      prev.filter((p) => p.status === "PROCESSING" || p.status === "PENDING")
    );

    // 2. Persist to DB
    try {
      const { pruneBackgroundTasksAction } = await import("@/lib/background-tasks/actions");
      await pruneBackgroundTasksAction();
    } catch (e) {
      console.error("Failed to prune background tasks from DB", e);
    }
  }, [processes]);

  const deleteMultiple = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    // 1. Update UI immediately
    setProcesses((prev) => prev.filter((p) => !ids.includes(p.id)));

    // 2. Persist to DB
    try {
      const { deleteBackgroundTasksAction } = await import("@/lib/background-tasks/actions");
      await deleteBackgroundTasksAction(ids);
    } catch (e) {
      console.error("Failed to delete background tasks from DB", e);
    }
  }, []);

  const activeCount = processes.filter(
    (p) => p.status === "PROCESSING" || p.status === "PENDING"
  ).length;
  
  const errorCount = processes.filter((p) => p.status === "ERROR").length;

  return (
    <ProcessContext.Provider
      value={{
        processes,
        activeCount,
        errorCount,
        clearFinished,
        deleteMultiple,
      }}
    >
      {children}
    </ProcessContext.Provider>
  );
}

export function useProcess() {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error("useProcess must be used within a ProcessProvider");
  }
  return context;
}
