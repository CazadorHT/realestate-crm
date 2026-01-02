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
        <DropdownMenuItem className="cursor-pointer" onSelect={(e) => { e.preventDefault(); copyPublicLink(); }}>
          <Share2 className="mr-2 h-4 w-4" />
          คัดลอกลิงก์ Public
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DeletePropertyMenuItem id={id} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
