"use client";

import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";

export function InboxContainer({
  initialConversations,
}: {
  initialConversations: any[];
}) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null,
  );

  const selectedConversation = initialConversations.find(
    (c) => c.id === selectedLeadId,
  );

  return (
    <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* Sidebar: Conversation List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800">
        <ConversationList
          conversations={initialConversations}
          selectedLeadId={selectedLeadId}
          onSelect={setSelectedLeadId}
        />
      </div>

      {/* Main: Message Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <MessageThread lead={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            เลือกการสนทนาเพื่อเริ่มแชท
          </div>
        )}
      </div>
    </div>
  );
}
