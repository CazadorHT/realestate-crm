"use client";

import React from "react";
import { 
  MessageSquare, 
  Bot, 
  Cpu, 
  Zap, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Facebook,
  Send,
  MessageCircle,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusItemProps {
  label: string;
  status: "online" | "warning" | "error" | "processing";
  icon: React.ReactNode;
  lastActive?: string;
}

const StatusItem = ({ label, status, icon, lastActive }: StatusItemProps) => {
  const statusConfig = {
    online: {
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      pulse: "bg-emerald-500",
      text: "Online"
    },
    warning: {
      color: "text-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-100",
      pulse: "bg-amber-500",
      text: "Issue"
    },
    error: {
      color: "text-rose-500",
      bg: "bg-rose-50",
      border: "border-rose-100",
      pulse: "bg-rose-500",
      text: "Offline"
    },
    processing: {
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-100",
      pulse: "bg-blue-500",
      text: "Syncing"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 hover:shadow-md",
      config.bg,
      config.border,
      "bg-white/50 backdrop-blur-sm"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-600 group-hover:scale-110 transition-transform duration-300",
          config.color
        )}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-700 tracking-tight">{label}</span>
          {lastActive && (
            <span className="text-[10px] text-slate-400 font-medium">{lastActive}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/80 border border-slate-100">
        <div className="relative flex h-2 w-2">
          <span className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            config.pulse
          )}></span>
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            config.pulse
          )}></span>
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>
          {config.text}
        </span>
      </div>
    </div>
  );
};

export function SystemStatusWidget() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">System Integrations</h3>
            <p className="text-[10px] text-slate-500 font-medium">Real-time connectivity status</p>
          </div>
        </div>
        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Messaging Group */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Messaging</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <StatusItem 
              label="LINE OA Webhook" 
              status="online" 
              icon={<MessageCircle className="h-3.5 w-3.5" />} 
              lastActive="Active 2m ago"
            />
            <StatusItem 
              label="Telegram Bot" 
              status="online" 
              icon={<Send className="h-3.5 w-3.5" />} 
              lastActive="Active 5m ago"
            />
            <StatusItem 
              label="Facebook Meta" 
              status="warning" 
              icon={<Facebook className="h-3.5 w-3.5" />} 
              lastActive="Token expires in 3 days"
            />
          </div>
        </div>

        {/* AI & Automation Group */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI & Core</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <StatusItem 
              label="Smart Match Engine" 
              status="processing" 
              icon={<Cpu className="h-3.5 w-3.5" />} 
              lastActive="Matching 12 leads"
            />
            <StatusItem 
              label="AI Review Agent" 
              status="online" 
              icon={<Bot className="h-3.5 w-3.5" />} 
              lastActive="Standby"
            />
          </div>
        </div>

        {/* Infrastructure Group */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Infrastructure</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <StatusItem 
              label="Inngest Workers" 
              status="online" 
              icon={<Zap className="h-3.5 w-3.5" />} 
              lastActive="5 nodes active"
            />
            <StatusItem 
              label="Database (RLS)" 
              status="online" 
              icon={<ShieldCheck className="h-3.5 w-3.5" />} 
              lastActive="Latency: 24ms"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Globe className="h-12 w-12 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Overall Health: 98.4%</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">All systems operational. Next scheduled maintenance in 12 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
