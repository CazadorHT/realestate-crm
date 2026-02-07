import { Metadata } from "next";
import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ค้นหาอสังหาริมทรัพย์ | บ้าน คอนโด สำนักงานออฟฟิศ",
  description:
    "ค้นหาบ้าน คอนโด ที่ดิน สำนักงาน อสังหาริมทรัพย์ทุกประเภทสำหรับขายและเช่า พร้อมระบบกรองอัจฉริยะ",
};

export default function PublicPropertiesPage() {
  return (
    <>
      {/* Schema.org Structured Data */}

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 mt-16">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-4">
          <AppBreadcrumbs />
        </div>
        <PropertySearchPage />
      </div>
    </>
  );
}
