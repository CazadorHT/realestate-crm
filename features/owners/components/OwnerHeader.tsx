"use client";

import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { EditOwnerDialog } from "@/components/owners/EditOwnerDialog";
import { Owner } from "@/features/owners/types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface OwnerHeaderProps {
  owner: Owner;
  propertyCount: number;
}

export function OwnerHeader({ owner, propertyCount }: OwnerHeaderProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="bg-linear-to-r from-slate-800 to-slate-900 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {owner.full_name?.charAt(0).toUpperCase() || "O"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{owner.full_name}</h1>
            <p className="text-slate-300 text-sm mt-1">
              {isEn
                ? `Property Owner • ${propertyCount} listings in system`
                : `เจ้าของทรัพย์ • ${propertyCount} ทรัพย์ในระบบ`}
            </p>
          </div>
        </div>
        <EditOwnerDialog
          owner={owner}
          trigger={
            <Button variant="secondary" className="gap-2 shadow-lg cursor-pointer">
              <Edit className="h-4 w-4" />
              {isEn ? "Edit Owner" : "แก้ไขข้อมูล"}
            </Button>
          }
        />
      </div>
    </div>
  );
}
