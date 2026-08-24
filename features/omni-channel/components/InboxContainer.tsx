"use client";

import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function InboxContainer({
  initialConversations,
}: {
  initialConversations: any[];
}) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null,
  );

  const filteredConversations = initialConversations.filter((conv) => {
    if (!filterCategory) return true;
    const cat = conv.preferences?.category || "CUSTOMER";
    return cat === filterCategory;
  });

  const selectedConversation = initialConversations.find(
    (c) => c.id === selectedLeadId,
  );

  // Auto-select first in filtered list when filter changes
  const handleFilterChange = (category: string | null) => {
    setFilterCategory(category);
    const newFiltered = initialConversations.filter((conv) => {
      if (!category) return true;
      const cat = conv.preferences?.category || "CUSTOMER";
      return cat === category;
    });
    if (newFiltered.length > 0) {
      setSelectedLeadId(newFiltered[0].id);
    } else {
      setSelectedLeadId(null);
    }
  };

  return (
    <div className="flex flex-1 h-full max-h-full min-h-0 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Sidebar: Conversation List */}
      <div className="w-80 h-full max-h-full flex flex-col min-h-0 border-r border-slate-200 shrink-0 overflow-hidden">
        <ConversationList
          conversations={filteredConversations}
          allConversations={initialConversations}
          selectedLeadId={selectedLeadId}
          onSelectAction={setSelectedLeadId}
          filterCategory={filterCategory}
          onFilterChangeAction={handleFilterChange}
        />
      </div>

      {/* Main: Message Thread */}
      <div className="flex-1 flex flex-col h-full max-h-full min-h-0 min-w-0 overflow-hidden">
        {selectedConversation ? (
          <MessageThread lead={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">
            {isEn ? "Select a conversation to start chatting" : "เลือกการสนทนาเพื่อเริ่มแชท"}
          </div>
        )}
      </div>
    </div>
  );
}
