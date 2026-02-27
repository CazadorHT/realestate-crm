"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-sm">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">
            เกิดข้อผิดพลาดบางอย่าง
          </h2>
          <p className="mb-6 max-w-md text-slate-500">
            ขออภัย ระบบขัดข้องชั่วขณะ ทีมงานได้รับการแจ้งเตือนแล้ว
            และกำลังเร่งแก้ไขโดยด่วน
          </p>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <div className="mb-6 w-full max-w-lg rounded-md bg-slate-950 p-4 text-left overflow-auto">
              <p className="mb-2 font-mono text-xs font-bold text-red-400">
                Error: {this.state.error.message}
              </p>
              <pre className="font-mono text-[10px] text-slate-400">
                {this.state.error.stack?.split("\n").slice(0, 3).join("\n")}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={this.handleReset}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              ลองใหม่อีกครั้ง
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/protected")}
              className="border-slate-200"
            >
              <Home className="mr-2 h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
