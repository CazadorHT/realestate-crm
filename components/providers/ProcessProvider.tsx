"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
    let active = true;
    let channel: any = null;

    const initRealtime = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      if (!active) return;
      const supabase = createClient();
      
      const channelName = tenantId ? `system_task_queue_${tenantId}` : "system_task_queue_global";
      
      // Clean up existing channel first if any to avoid "callbacks after subscribe" error
      const existingChannel = supabase.getChannels().find((c: any) => c.topic === channelName || c.name === channelName);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }
      
      if (!active) return;

      channel = supabase
        .channel(channelName)
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
    };

    initRealtime();

    return () => {
      active = false;
      if (channel) {
        import("@/lib/supabase/client").then(({ createClient }) => {
          createClient().removeChannel(channel);
        });
      }
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

  // Keep processes in a ref so the polling interval doesn't reset on every update
  const processesRef = useRef(processes);
  useEffect(() => {
    processesRef.current = processes;
  }, [processes]);

  // 🔄 FALLBACK POLLING: If there are active tasks, poll every 5 seconds in case Realtime fails
  const activeCount = processes.filter(
    (p) => p.status === "PROCESSING" || p.status === "PENDING"
  ).length;

  useEffect(() => {
    if (activeCount === 0) return;

    const interval = setInterval(async () => {
      try {
        const { getBackgroundTasksAction } = await import("@/lib/background-tasks/actions");
        const res = await getBackgroundTasksAction();
        if (res.success && Array.isArray(res.data)) {
          // Find any tasks that were previously PENDING/PROCESSING but now SUCCESS/ERROR
          const prevActiveMap = new Map(
            processesRef.current
              .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
              .map((p) => [p.id, p])
          );

          if (prevActiveMap.size === 0) return;

          const updatedTasks = res.data.filter((task: any) => prevActiveMap.has(task.id));

          for (const task of updatedTasks) {
            const prevTask = prevActiveMap.get(task.id);
            if (!prevTask) continue;

            // If status changed to a finished state
            if (task.status !== prevTask.status) {
              // Dispatch local event so components listen
              window.dispatchEvent(
                new CustomEvent("app-process-event", {
                  detail: {
                    type: "PROCESS_UPDATED",
                    id: task.id,
                    status: task.status,
                    message: task.message || task.error_details || "",
                    resultLink: task.result_link,
                    errorDetails: task.error_details,
                  },
                })
              );

              if (task.status === "SUCCESS") {
                toast.success(`สำเร็จ: ${task.name}`, {
                  description: task.message,
                  action: task.result_link ? {
                    label: "ดูผลลัพธ์",
                    onClick: () => window.open(task.result_link, "_blank")
                  } : undefined
                });

                if (task.type === "BLOG_GENERATION" && task.result) {
                  window.dispatchEvent(
                    new CustomEvent("BLOG_AI_GENERATED_SUCCESS", { 
                      detail: task.result 
                    })
                  );
                }
              }

              if (task.status === "ERROR" || task.status === "CANCELLED") {
                if (task.type === "BLOG_GENERATION") {
                  window.dispatchEvent(new CustomEvent("BLOG_AI_GENERATION_ERROR"));
                  const isCancelled = task.status === "CANCELLED";
                  const errMsg = task.error_details || task.message || "การทำงานถูกยกเลิก";
                  if (isCancelled) {
                    toast.error("การสร้างบทความถูกยกเลิกแล้ว");
                  } else {
                    toast.error(`สร้างบทความล้มเหลว: ${errMsg}`);
                  }
                }
              }
            }
          }

          // Merge updates to state
          setProcesses((prev) => {
            const dbMap = new Map<string, any>(res.data.map((d: any) => [d.id, d]));
            return prev.map((p) => {
              const dbTask = dbMap.get(p.id);
              if (dbTask) {
                return {
                  ...p,
                  status: dbTask.status,
                  message: dbTask.message,
                  resultLink: dbTask.result_link,
                  errorDetails: dbTask.error_details,
                  completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : p.completedAt,
                };
              }
              return p;
            });
          });
        }
      } catch (err) {
        console.error("Polling background tasks error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeCount]);


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
