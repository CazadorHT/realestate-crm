import { createClient } from "@/lib/supabase/server";
import { InboxContainer } from "@/features/omni-channel/components/InboxContainer";

export const metadata = {
  title: "กล่องข้อความรวม (Omni-channel Inbox)",
  description: "จัดการข้อความจากทุกช่องทางในที่เดียว",
};

export default async function InboxPage() {
  const supabase = await createClient();

  // Fetch initial conversations (leads with latest omni messages)
  const { data: conversations } = await supabase
    .from("leads")
    .select(
      `
      id,
      full_name,
      source,
      line_id,
      omni_messages (
        id,
        content,
        created_at,
        direction,
        is_read
      )
    `,
    )
    .not("omni_messages", "is", null)
    .order("created_at", { referencedTable: "omni_messages", ascending: false })
    .limit(1, { referencedTable: "omni_messages" });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          กล่องข้อความรวม
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          จัดการการแชทจาก LINE, Facebook, และช่องทางอื่นๆ
        </p>
      </div>

      <InboxContainer initialConversations={conversations || []} />
    </div>
  );
}
