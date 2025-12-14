"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Archive, Trash, Share2 } from "lucide-react";
import { DeletePropertyButton } from "@/components/DeletePropertyButton";

interface PropertyRowActionsProps {
  id: string; // UUID
}

export function PropertyRowActions({ id }: PropertyRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem asChild>
          <Link href={`/protected/properties/${id}`} className="cursor-pointer">
             <Eye className="mr-2 h-4 w-4" /> ดูข้อมูล
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/protected/properties/${id}/edit`} className="cursor-pointer">
             <Edit className="mr-2 h-4 w-4" /> แก้ไข
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
             <Share2 className="mr-2 h-4 w-4" /> แชร์
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-indigo-600 focus:text-indigo-600">
             <Archive className="mr-2 h-4 w-4" /> เก็บถาวร
        </DropdownMenuItem>
        <div className="p-1">
             <DeletePropertyButton id={id} /> 
             {/* DeletePropertyButton renders a trigger, we might need to adjust it to fit in menu 
                 but for now assuming it handles its own dialog. A cleaner way would be to expose invoke 
                 method or just put a Delete Item here that triggers state.
                 For now, let's keep it simple or assume DeletePropertyButton works as a trigger.
             */}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
