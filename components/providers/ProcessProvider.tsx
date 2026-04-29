"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BackgroundProcess, ProcessEvent } from "@/lib/process-monitor";

interface ProcessContextType {
  processes: BackgroundProcess[];
  activeCount: number;
  errorCount: number;
  clearFinished: () => void;
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

const STORAGE_KEY = "app_process_history";

export function ProcessProvider({ children }: { children: React.ReactNode }) {
  const [processes, setProcesses] = useState<BackgroundProcess[]>([]);

  // 🛡️ Load from Database on mount (Enterprise Persistence)
  useEffect(() => {
    const syncWithDB = async () => {
      try {
        const { getBackgroundTasksAction } = await import("@/lib/background-tasks/actions");
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
  }, []);

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

  const clearFinished = useCallback(() => {
    setProcesses((prev) => 
      prev.filter((p) => p.status === "PROCESSING" || p.status === "PENDING")
    );
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
