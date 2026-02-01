"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export function NotificationBell() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full border  border-slate-200 bg-white shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
        >
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="sr-only">Toggle notifications</span>
          {/* Badge Example (Hidden for now) */}
          {/* <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
          </span> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="text-sm font-semibold leading-none">การแจ้งเตือน</h4>
          <span className="text-xs text-muted-foreground">0 รายการใหม่</span>
        </div>
        <Separator />
        <div className="h-[300px] overflow-y-auto">
          <div className="flex flex-col gap-1 p-2">
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-10 w-10 opacity-20" />
              <p>ไม่มีการแจ้งเตือนใหม่</p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-center text-xs h-8">
            ดูทั้งหมด
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
