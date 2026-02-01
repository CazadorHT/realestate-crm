import { OwnerForm } from "@/features/owners/OwnerForm";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserPlus } from "lucide-react";

export default function NewOwnerPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <Breadcrumb
        backHref="/protected/owners"
        items={[
          { label: "เจ้าของทรัพย์", href: "/protected/owners" },
          { label: "เพิ่มเจ้าของทรัพย์ใหม่" },
        ]}
      />
      <div className="flex items-center gap-3 mt-4">
        <div className="h-12 w-12 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            เพิ่มเจ้าของทรัพย์ใหม่
          </h1>
          <p className="text-sm text-slate-500">กรอกข้อมูลเพื่อเพิ่มเจ้าของ</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 bg-linear-to-r from-slate-800 to-slate-900 ">
          <h2 className="font-semibold text-white">ข้อมูลเจ้าของทรัพย์</h2>
          <p className="text-sm text-slate-300">กรุณากรอกข้อมูลให้ครบถ้วน</p>
        </div>
        <div className="p-6">
          <OwnerForm mode="create" />
        </div>
      </div>
    </div>
  );
}
