"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

export type RealtimeStatus = 'INITIAL' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'HIBERNATING';

interface SubscriptionConfig {
  table: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
}

interface RegistryEntry {
  channel: RealtimeChannel | null;
  callbacks: Set<(payload: RealtimePostgresChangesPayload<any>) => void>;
  refreshCallbacks: Set<() => void>;
  presenceCallbacks: Set<(state: any) => void>;
  broadcastCallbacks: Set<(event: string, payload: any) => void>;
  refCount: number;
  config: SubscriptionConfig;
  retryCount: number;
  isConnecting: boolean;
}

interface RealtimeContextType {
  subscribe: (
    config: SubscriptionConfig,
    handlers: {
      onData?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onRefresh?: () => void;
      onPresence?: (state: any) => void;
      onBroadcast?: (event: string, payload: any) => void;
    }
  ) => () => void;
  broadcast: (table: string, filter: string, event: string, payload: any) => void;
  trackPresence: (table: string, filter: string, state: any) => void;
  reconnect: () => void;
  status: RealtimeStatus;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

const HIBERNATE_DELAY = 10000;
const MAX_RETRY_DELAY = 30000;
const INITIAL_RETRY_DELAY = 1000;
const STATUS_SMOOTHING_DELAY = 2500; // 2.5s smoothing
const supabase = createClient();

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>('INITIAL');
  const [rawStatus, setRawStatus] = useState<RealtimeStatus>('INITIAL');
  const [isHibernating, setIsHibernating] = useState(false);
  
  const registry = useRef<Map<string, RegistryEntry>>(new Map());
  const hibernateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const statusSmoothingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  const connectRef = useRef<(key: string, entry: RegistryEntry) => Promise<void>>(null as any);

  // Status Smoothing: Only show ERROR if failure persists
  useEffect(() => {
    if (rawStatus === 'CONNECTED' || rawStatus === 'INITIAL') {
      if (statusSmoothingTimeoutRef.current) {
        clearTimeout(statusSmoothingTimeoutRef.current);
        statusSmoothingTimeoutRef.current = null;
      }
      setStatus(rawStatus);
    } else if (rawStatus === 'ERROR' || rawStatus === 'CONNECTING') {
      if (!statusSmoothingTimeoutRef.current) {
        statusSmoothingTimeoutRef.current = setTimeout(() => {
          setStatus(rawStatus);
        }, STATUS_SMOOTHING_DELAY);
      }
    } else {
      setStatus(rawStatus);
    }
  }, [rawStatus]);

  function handleRetry(key: string, entry: RegistryEntry) {
    if (entry.retryCount >= 10) {
      console.warn(`[Realtime] Max retries reached for ${key}`);
      return;
    }

    // Exponential Backoff + Jitter (Masterclass Strategy)
    const baseDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, entry.retryCount), MAX_RETRY_DELAY);
    const jitter = Math.random() * 1000; // Add up to 1s random jitter
    const delay = baseDelay + jitter;
    
    entry.retryCount++;

    const timeout = setTimeout(() => {
      if (connectRef.current) {
        connectRef.current(key, entry);
      }
    }, delay);
    retryTimeouts.current.set(key, timeout);
  }

  const connect = useCallback(async (key: string, entry: RegistryEntry) => {
    if (entry.isConnecting) return;
    
    entry.isConnecting = true;
    setRawStatus('CONNECTING');

    if (retryTimeouts.current.has(key)) {
      clearTimeout(retryTimeouts.current.get(key));
      retryTimeouts.current.delete(key);
    }

    const { table, filter, event = "*" } = entry.config;
    
    // Hardening: Cleanup existing channel before creating a new one
    // We MUST await this to ensure the state machine is ready for a new channel
    if (entry.channel) {
      try {
        await supabase.removeChannel(entry.channel);
      } catch (e) {
        console.warn(`[Realtime] Failed to remove channel ${key}, proceeding anyway...`, e);
      }
      entry.channel = null;
    }

    // Proactive Session Validation: Ensure JWT is fresh for protected tables
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn(`[Realtime] ⚠️ No active session found. Realtime may fail for protected table: ${table}`);
      }
    } catch (e) {
      console.error("[Realtime] Error checking session:", e);
    }

    // Check if this entry is still the active one in the registry and still has subscribers.
    // If it was cleaned up/unmounted during the async boundaries, abort to prevent leaks and clashes.
    if (registry.current.get(key) !== entry || entry.refCount <= 0) {
      entry.isConnecting = false;
      return;
    }

    try {
      if (!supabase.realtime.isConnected()) {
        supabase.realtime.connect();
      }

      // Hardening: Use a unique sub-key for every connection attempt
      // This prevents the "mismatch between server and client bindings" error
      // which happens when reusing a channel name that still has stale bindings.
      const attemptId = Date.now();
      const channelName = `${key}:${attemptId}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event, schema: "public", table, filter },
          (payload: RealtimePostgresChangesPayload<any>) => {
            entry.callbacks.forEach((cb) => {
              try { cb(payload); } catch (err) { console.error(`[Realtime] Callback error (${key}):`, err); }
            });
          }
        )
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          entry.presenceCallbacks.forEach(cb => cb(state));
        })
        .on("broadcast", { event: "*" }, ({ event, payload }) => {
          entry.broadcastCallbacks.forEach(cb => cb(event, payload));
        })
        .subscribe((subscribeStatus, err) => {
          entry.isConnecting = false;
          if (subscribeStatus === "SUBSCRIBED") {
            entry.retryCount = 0;
            setRawStatus('CONNECTED');
          } else if (subscribeStatus === "CHANNEL_ERROR" || subscribeStatus === "TIMED_OUT") {
            const isTimeout = subscribeStatus === "TIMED_OUT";
            console.error(
              `🚨 [Realtime-Doctor] Subscriber ${isTimeout ? 'TIMEOUT' : 'ERROR'} for channel "${key}":`, 
              {
                status: subscribeStatus,
                error: err,
                timestamp: new Date().toISOString()
              }
            );
            
            setRawStatus('ERROR');
            handleRetry(key, entry);
          }
        }, 20000); // 20s timeout
      
      entry.channel = channel;
    } catch (e) {
      console.error(`[Realtime] Error during channel subscription setup for ${key}:`, e);
      entry.isConnecting = false;
      setRawStatus('ERROR');
      handleRetry(key, entry);
    }
  }, [handleRetry]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnectAll = useCallback(() => {
    registry.current.forEach((entry, key) => {
      if (entry.channel) supabase.removeChannel(entry.channel);
      if (retryTimeouts.current.has(key)) {
        clearTimeout(retryTimeouts.current.get(key));
        retryTimeouts.current.delete(key);
      }
    });
    setStatus('DISCONNECTED');
  }, [supabase]);

  const reconnectAll = useCallback(() => {
    registry.current.forEach((entry, key) => {
      connect(key, entry);
      entry.refreshCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
    });
  }, [connect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hibernateTimeoutRef.current = setTimeout(() => {
          setIsHibernating(true);
          setStatus('HIBERNATING');
          disconnectAll();
        }, HIBERNATE_DELAY);
      } else {
        if (hibernateTimeoutRef.current) {
          clearTimeout(hibernateTimeoutRef.current);
          hibernateTimeoutRef.current = null;
        }
        if (isHibernating) {
          setIsHibernating(false);
          reconnectAll();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isHibernating, disconnectAll, reconnectAll]);
  
  // Visual Feedback for Reconnection status
  useEffect(() => {
    if (status === 'ERROR') {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.error("การเชื่อมต่อ Realtime ขัดข้อง ระบบกำลังพยายามเชื่อมต่อใหม่...", {
          duration: Infinity,
          id: "realtime-error",
        });
      }
    } else if (status === 'CONNECTED') {
      if (toastIdRef.current) {
        toast.dismiss("realtime-error");
        toast.success("การเชื่อมต่อ Realtime กลับมาใช้งานได้ปกติแล้ว", {
          duration: 3000,
        });
        toastIdRef.current = null;
      }
    }
  }, [status]);

  const subscribe = useCallback((config: SubscriptionConfig, handlers: any) => {
    const key = `${config.table}:${config.filter || "*"}:${config.event || "*"}`;
    
    let entry = registry.current.get(key);
    if (!entry) {
      entry = {
        channel: null,
        callbacks: new Set(),
        refreshCallbacks: new Set(),
        presenceCallbacks: new Set(),
        broadcastCallbacks: new Set(),
        refCount: 0,
        config,
        retryCount: 0,
        isConnecting: false,
      };
      registry.current.set(key, entry);
    }

    if (handlers.onData) entry.callbacks.add(handlers.onData);
    if (handlers.onRefresh) entry.refreshCallbacks.add(handlers.onRefresh);
    if (handlers.onPresence) entry.presenceCallbacks.add(handlers.onPresence);
    if (handlers.onBroadcast) entry.broadcastCallbacks.add(handlers.onBroadcast);
    entry.refCount++;

    if (entry.refCount === 1 && !isHibernating) {
      connect(key, entry);
    }

    return () => {
      const e = registry.current.get(key);
      if (!e) return;
      if (handlers.onData) e.callbacks.delete(handlers.onData);
      if (handlers.onRefresh) e.refreshCallbacks.delete(handlers.onRefresh);
      if (handlers.onPresence) e.presenceCallbacks.delete(handlers.onPresence);
      if (handlers.onBroadcast) e.broadcastCallbacks.delete(handlers.onBroadcast);
      e.refCount--;

      if (e.refCount <= 0) {
        if (e.channel) supabase.removeChannel(e.channel);
        registry.current.delete(key);
      }
    };
  }, [isHibernating, connect]);

  const broadcast = useCallback((table: string, filter: string, event: string, payload: any) => {
    const key = `${table}:${filter || "*"}:*`;
    const entry = registry.current.get(key);
    if (entry?.channel) {
      entry.channel.send({ type: 'broadcast', event, payload });
    }
  }, []);

  const trackPresence = useCallback((table: string, filter: string, state: any) => {
    const key = `${table}:${filter || "*"}:*`;
    const entry = registry.current.get(key);
    if (entry?.channel) {
      entry.channel.track(state);
    }
  }, []);

  return (
    <RealtimeContext.Provider value={{ subscribe, status, reconnect: reconnectAll, broadcast, trackPresence }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used within RealtimeProvider");
  return context;
}
