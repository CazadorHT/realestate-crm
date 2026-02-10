import { createClient } from "@/lib/supabase/server";
import { getDeletedProperties } from "@/lib/db/properties";
import React from "react";
import { TrashTable } from "./TrashTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";

export default async function TrashPage() {
  const deletedProperties = await getDeletedProperties();
  const count = deletedProperties.length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-red-600 via-rose-600 to-pink-600 p-6 md:p-8 shadow-xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-white hover:text-white hover:bg-white/20 -ml-2"
              >
                <Link href="/protected/properties">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
              </Button>
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                ถังขยะ (Trash)
              </h1>
            </div>
            <p className="text-red-100 text-sm md:text-base max-w-md ml-11">
              จัดการทรัพย์ที่ถูกลบ กู้คืน หรือลบถาวร • มีทั้งหมด{" "}
              <span className="font-bold text-white">{count}</span> รายการ
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h5 className="font-medium leading-none tracking-tight">คำเตือน</h5>
            <p className="text-sm opacity-90">
              รายการในถังขยะจะถูกเก็บไว้เป็นเวลา 30
              วันก่อนที่จะถูกลบออกจากระบบอย่างถาวร
            </p>
          </div>
        </div>

        <TrashTable data={deletedProperties} />
      </div>
    </div>
  );
}
