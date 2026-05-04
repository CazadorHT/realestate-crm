"use client";

export type ProcessStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";

export interface BackgroundProcess {
  id: string;
  name: string;
  status: ProcessStatus;
  message?: string;
  startedAt: Date;
  completedAt?: Date;
  type?: string;
  payload?: unknown;
  onRetry?: () => void;
  resultLink?: string;
  errorDetails?: string;
}

export type ProcessEvent = 
  | { type: "PROCESS_STARTED"; process: BackgroundProcess }
  | { type: "PROCESS_UPDATED"; id: string; status: ProcessStatus; message?: string; resultLink?: string; errorDetails?: string }
  | { type: "PROCESSES_SYNCED"; processes: BackgroundProcess[] };

const APP_PROCESS_EVENT = "app-process-event";

/**
 * Dispatch a process event that can be heard by the ProcessProvider.
 */
export function dispatchProcessEvent(event: ProcessEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APP_PROCESS_EVENT, { detail: event }));
}

/**
 * Start a process and sync to DB
 */
export function startProcess(
  name: string, 
  options?: { id?: string; type?: string; payload?: unknown; onRetry?: () => void }
): string {
  // 🛡️ Use provided ID or generate a new one
  const id = options?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7));
  
  const process: BackgroundProcess = {
    id,
    name,
    status: "PROCESSING",
    startedAt: new Date(),
    type: options?.type,
    payload: options?.payload,
    onRetry: options?.onRetry,
  };

  dispatchProcessEvent({
    type: "PROCESS_STARTED",
    process
  });

  // 🛡️ Persistence: Sync to Database (Non-blocking)
  import("./background-tasks/actions").then(({ createBackgroundTaskAction }) => {
    createBackgroundTaskAction({
      id,
      name,
      type: options?.type,
      payload: options?.payload,
    });
  });

  return id;
}

/**
 * Update a process status and message, and sync to DB
 */
export function finishProcess(
  id: string, 
  status: "SUCCESS" | "ERROR" | "PROCESSING", 
  message?: string,
  options?: { resultLink?: string; errorDetails?: string }
) {
  dispatchProcessEvent({
    type: "PROCESS_UPDATED",
    id,
    status,
    message,
    resultLink: options?.resultLink,
    errorDetails: options?.errorDetails
  });

  // 🛡️ Persistence: Sync to Database (Non-blocking)
  import("./background-tasks/actions").then(({ updateBackgroundTaskAction }) => {
    updateBackgroundTaskAction({
      id,
      status,
      message,
      result_link: options?.resultLink,
      error_details: options?.errorDetails
    });
  });
}

/**
 * Alias for finishProcess(id, 'PROCESSING', message)
 */
export function updateProcess(id: string, message: string) {
  finishProcess(id, "PROCESSING", message);
}

