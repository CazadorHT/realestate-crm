import { getInboxConversationsQuery } from "@/features/omni-channel/queries";
import { InboxContainer } from "@/features/omni-channel/components/InboxContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const metadata = {
  title: "กล่องข้อความรวม (Omni-channel Inbox)",
  description: "จัดการข้อความจากทุกช่องทางในที่เดียว",
};

import { Suspense } from "react";

export default async function InboxPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-6">
      <PageHeader
        title="กล่องข้อความรวม"
        subtitle="จัดการการแชทจาก LINE, Facebook, และช่องทางอื่นๆ"
        icon="messageSquare"
        gradient="blue"
      />

      <Suspense fallback={<div className="h-full animate-pulse bg-slate-50 rounded-2xl" />}>
        <InboxWrapper />
      </Suspense>
    </div>
  );
}

async function InboxWrapper() {
  const conversations = await getInboxConversationsQuery();
  return <InboxContainer initialConversations={conversations} />;
}

