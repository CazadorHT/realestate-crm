import { getLineTemplates } from "@/features/line/actions";
import { LineManagerClient } from "@/app/(protected)/protected/line-manager/client";
import { FaLine } from "react-icons/fa";

export default async function LineManagerPage() {
  const templates = await getLineTemplates();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4  bg-linear-to-br from-emerald-900 via-green-800 to-emerald-900 py-14 px-6 rounded-2xl shadow-lg shadow-emerald-100 mb-10">
        <div className="bg-[#00B900] p-3 rounded-2xl shadow-lg shadow-emerald-700">
          <FaLine className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Line Notification Manager
          </h1>
          <p className="text-white/80 text-sm">
            จัดการรูปแบบและข้อความแจ้งเตือน Line Flex Message
          </p>
        </div>
      </div>

      <LineManagerClient initialTemplates={templates} />
    </div>
  );
}
