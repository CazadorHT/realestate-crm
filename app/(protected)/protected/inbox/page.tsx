import { getInboxConversationsQuery } from "@/features/omni-channel/queries";
import { InboxContainer } from "@/features/omni-channel/components/InboxContainer";
import { Metadata } from "next";
import { InboxTour } from "@/features/omni-channel/_components/InboxTour";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  return {
    title: isEn ? "Omni-Channel Inbox | Real Estate CRM" : "กล่องข้อความรวม (Omni-channel Inbox) | Real Estate CRM",
    description: isEn
      ? "Manage all customer chats from LINE, Facebook, and other channels in one place."
      : "จัดการข้อความจากทุกช่องทางในที่เดียว",
  };
}

export default async function InboxPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  return (
    <div 
      className="flex flex-col gap-2 overflow-hidden w-full h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8rem)]"
      style={{
        height: "calc(100dvh - 8rem)",
        maxHeight: "calc(100dvh - 8rem)"
      }}
    >
      <InboxTour />
      
      {/* Sleek, Ultra-Compact Low-Profile Header specifically for Inbox */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-slate-800 leading-none">
              {isEn ? "Omni-Channel Inbox" : "กล่องข้อความรวม"}
            </h1>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100">
              Live
            </span>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              • {isEn ? "Manage chat conversations" : "จัดการการแชทจากทุกช่องทาง"}
            </span>
          </div>
        </div>

        {/* Subtle Breadcrumbs Navigation */}
        <nav className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
          <Link href="/protected" className="hover:text-slate-700 transition-colors">
            {isEn ? "Dashboard" : "แดชบอร์ด"}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-semibold">{isEn ? "Inbox" : "กล่องข้อความรวม"}</span>
        </nav>
      </div>

      <div className="flex-1 min-h-0 h-0 flex flex-col overflow-hidden">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-50 rounded-2xl" />}>
          <InboxWrapper />
        </Suspense>
      </div>
    </div>
  );
}

async function InboxWrapper() {
  const conversations = await getInboxConversationsQuery();
  return <InboxContainer initialConversations={conversations} />;
}

