"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AnalyticsErrorProps {
  message: string;
  onRetry?: () => void;
}

export function AnalyticsError({ message, onRetry }: AnalyticsErrorProps) {
  return (
    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in duration-500">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle className="font-bold">เกิดข้อผิดพลาดในการดึงข้อมูลวิเคราะห์</AlertTitle>
      <AlertDescription className="text-red-700 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span>{message || "ไม่สามารถติดต่อฐานข้อมูลได้ในขณะนี้ โปรดตรวจสอบการเชื่อมต่อของคุณ"}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="bg-white border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors gap-2 h-8"
          >
            <RefreshCw className="h-3 w-3" />
            ลองใหม่อีกครั้ง
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
