"use client";

import { useState } from "react";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";

export function InboxContainer({
  initialConversations,
}: {
  initialConversations: any[];
}) {
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
    <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ">
      {/* Sidebar: Conversation List */}
      <div className="w-80 border-r border-slate-200">
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
