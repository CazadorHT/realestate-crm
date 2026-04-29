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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        interface SerializedProcess extends Omit<BackgroundProcess, 'startedAt' | 'completedAt' | 'onRetry'> {
          startedAt: string;
          completedAt?: string;
        }
        const revived = (parsed as SerializedProcess[]).map((p) => ({
          ...p,
          startedAt: new Date(p.startedAt),
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
          // onRetry cannot be persisted, it will be lost on refresh
        }));
        setProcesses(revived);
      } catch (e) {
        console.error("Failed to load process history", e);
      }
    }
  }, []);

  // Save to localStorage whenever processes change (Limit to 10)
  useEffect(() => {
    // We remove onRetry as it's not serializable
    const toSave = processes.slice(0, 10).map(({ onRetry, ...p }) => p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [processes]);

  useEffect(() => {
    const handler = (e: Event) => {
      const event = (e as CustomEvent<ProcessEvent>).detail;
      
      if (event.type === "PROCESS_STARTED") {
        setProcesses((prev) => [event.process, ...prev].slice(0, 20)); // Keep slightly more in memory
      } else if (event.type === "PROCESS_UPDATED") {
        setProcesses((prev) =>
          prev.map((p) =>
            p.id === event.id
              ? {
                  ...p,
                  status: event.status,
                  message: event.message,
                  completedAt:
                    event.status === "SUCCESS" || event.status === "ERROR"
                      ? new Date()
                      : p.completedAt,
                }
              : p
          )
        );
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
