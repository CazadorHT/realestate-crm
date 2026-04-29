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
}

export type ProcessEvent = 
  | { type: "PROCESS_STARTED"; process: BackgroundProcess }
  | { type: "PROCESS_UPDATED"; id: string; status: ProcessStatus; message?: string };

const APP_PROCESS_EVENT = "app-process-event";

/**
 * Dispatch a process event that can be heard by the ProcessProvider.
 * Use this to trigger updates from anywhere in the client.
 */
export function dispatchProcessEvent(event: ProcessEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APP_PROCESS_EVENT, { detail: event }));
}

/**
 * Convenience helper to start a process
 */
export function startProcess(
  name: string, 
  options?: { type?: string; payload?: unknown; onRetry?: () => void }
): string {
  const id = Math.random().toString(36).substring(7);
  dispatchProcessEvent({
    type: "PROCESS_STARTED",
    process: {
      id,
      name,
      status: "PROCESSING",
      startedAt: new Date(),
      type: options?.type,
      payload: options?.payload,
      onRetry: options?.onRetry,
    }
  });
  return id;
}

/**
 * Convenience helper to update a process
 */
export function finishProcess(id: string, status: "SUCCESS" | "ERROR", message?: string) {
  dispatchProcessEvent({
    type: "PROCESS_UPDATED",
    id,
    status,
    message
  });
}
