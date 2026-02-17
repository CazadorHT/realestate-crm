import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RuleList } from "@/features/rent-notifications/components/RuleList";
import { AddRuleDialog } from "@/features/rent-notifications/components/AddRuleDialog";
import {
  getRentNotificationRules,
  getLineGroups,
  getAllPropertiesSimple,
} from "@/features/rent-notifications/queries.server";

export const metadata = {
  title: "Rent Notifications | Real Estate CRM",
};

export default async function RentNotificationsPage() {
  const rules = await getRentNotificationRules();
  const groups = await getLineGroups();
  const properties = await getAllPropertiesSimple();

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            LINE Rent Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            จัดการการแจ้งเตือนค่าเช่าอัตโนมัติผ่าน LINE Group
          </p>
        </div>
        <AddRuleDialog groups={groups} properties={properties} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Suspense
          fallback={<div className="p-8 text-center">Loading rules...</div>}
        >
          <RuleList
            initialRules={rules}
            groups={groups}
            properties={properties}
          />
        </Suspense>
      </div>

      <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          ℹ️ วิธีใช้งาน
        </h3>
        <ul className="list-disc list-inside space-y-1 opacity-90">
          <li>เชิญบอทเข้ากลุ่ม LINE ที่ต้องการแจ้งเตือน</li>
          <li>บอทจะบันทึกกลุ่มเข้าระบบอัตโนมัติ</li>
          <li>พิมพ์ /id เพื่อดู [ไอดีกลุ่ม]</li>
          <li>พิมพ์ /setname [ชื่อกลุ่ม] เพื่อตั้งชื่อกลุ่ม</li>
          <li>กลับมาหน้านี้ กดปุ่ม "สร้างการแจ้งเตือน" (Add Rule)</li>
          <li>เลือกทรัพย์, เลือกกลุ่ม LINE, และวันที่ต้องการแจ้งเตือน</li>
          <li>
            ระบบจะส่งข้อความแจ้งเตือนอัตโนมัติในวันที่กำหนด (ประมาณ 09:00 น.)
          </li>
        </ul>
      </div>
    </div>
  );
}
