"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Share2 } from "lucide-react";
import { toast } from "sonner";
import { DeletePropertyMenuItem } from "./DeletePropertyMenuItem";

export function PropertyRowActions({ id }: { id: string }) {
  const copyPublicLink = async () => {
    const url = `${window.location.origin}/properties/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์หน้า Public แล้ว");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[190px]">
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            copyPublicLink();
          }}
        >
          <Share2 className="mr-2 h-4 w-4" />
          คัดลอกลิงก์ Public
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer text-blue-600 focus:text-blue-700"
          onSelect={() => {
            toast.success("ดันประกาศสำเร็จ (Mock)");
            // In real app, call server action to update updated_at
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          ดันประกาศ (Renew)
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DeletePropertyMenuItem id={id} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
