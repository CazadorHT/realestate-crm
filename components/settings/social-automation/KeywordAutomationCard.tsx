import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  MessageSquareQuote,
  Plus,
  Loader2,
  Save,
  Facebook,
  Instagram,
} from "lucide-react";
import { SocialKeyword } from "@/features/site-settings/schema";
import { getMockPropertyData } from "./constants";
import { SmartTagsCheatSheet } from "./components/SmartTagsCheatSheet";
import { KeywordChip } from "./components/KeywordChip";
import { KeywordEditorDialog } from "./components/KeywordEditorDialog";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { useLanguage } from "@/lib/i18n/language-context";

interface KeywordAutomationCardProps {
  keywords: SocialKeyword[];
  addRow: () => void;
  removeRow: (index: number) => void;
  updateRow: (index: number, data: Partial<SocialKeyword>) => void;
  handleSave: () => void;
  handleAiGenerate: (type: "KEYWORD_DM", index: number) => void;
  isPending: boolean;
  hasChanges: boolean;
  isGenerating: string | null;
  scrollToTemplate: () => void;
}

export function KeywordAutomationCard({
  keywords,
  addRow,
  removeRow,
  updateRow,
  handleSave,
  handleAiGenerate,
  isPending,
  hasChanges,
  isGenerating,
  scrollToTemplate,
}: KeywordAutomationCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    addRow();
    setEditingIndex(keywords.length);
  };

  const closeDialog = () => {
    setEditingIndex(null);
  };

  // Validation Helpers
  const isDuplicate = (index: number) => {
    const currentKeyword = keywords[index]?.keyword?.trim().toLowerCase();
    if (!currentKeyword) return false;
    return keywords.some((item, i) => i !== index && item.keyword?.trim().toLowerCase() === currentKeyword);
  };

  const isInvalid = (index: number) => {
    const item = keywords[index];
    return !item?.keyword?.trim() || !item?.dm_content?.trim();
  };

  const hasAnyErrors = keywords.some((_, index) => isInvalid(index) || isDuplicate(index));

  const renderTemplate = (content: string) => {
    if (!content) return "";
    let rendered = content;
    const mockData = getMockPropertyData(isEn);
    Object.entries(mockData).forEach(([key, value]) => {
      rendered = rendered.replaceAll(`{{${key}}}`, value as string);
    });
    return rendered;
  };

  return (
    <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-900/5">
      <CardHeader className="bg-linear-to-b from-white to-slate-50/50 border-b border-slate-200 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 ring-4 ring-blue-50">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
                Keyword Automation
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                {isEn 
                  ? "Comment trigger to instant DM reply! Configure keyword automation rules." 
                  : "คอมเมนต์ปุ๊บ ส่ง DM ปั๊บ! ตั้งค่าคำสำคัญเพื่อเริ่มการทำงานอัตโนมัติ"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAdd}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-6 h-10 shadow-md shadow-blue-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isEn ? "Add Rule" : "เพิ่มชุดคำสั่ง"}
            </Button>
          </div>
        </div>

        <SmartTagsCheatSheet />
      </CardHeader>

      <CardContent className="p-0 bg-slate-50/20">
        <div className="p-8">
          {keywords.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-40 scale-150 animate-pulse" />
                <div className="relative p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl">
                  <MessageSquareQuote className="h-14 w-14 text-slate-200" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {isEn ? "No Auto-Replies Configured" : "ยังไม่มีระบบตอบกลับ"}
              </h3>
              <p className="text-slate-500 max-w-sm mt-3 font-medium leading-relaxed">
                {isEn 
                  ? "Save time with automated responses. Start by adding your first keyword rule." 
                  : "ประหยัดเวลาด้วยระบบตอบกลับอัตโนมัติ เริ่มต้นง่ายๆ โดยการเพิ่มคำสำคัญชุดแรกของคุณ"}
              </p>
              <Button
                onClick={handleAdd}
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-10 h-10 shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-5 w-5 mr-2" />
                {isEn ? "Add First Keyword" : "เพิ่ม Keyword แรก"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {keywords.map((item, index) => (
                  <KeywordChip
                    key={index}
                    index={index}
                    item={item}
                    error={isInvalid(index) || isDuplicate(index)}
                    onClick={setEditingIndex}
                  />
                ))}

                <Button
                  onClick={handleAdd}
                  variant="outline"
                  className="rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 px-6 h-[42px] transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isEn ? "Add Keyword" : "เพิ่ม Keyword"}
                </Button>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400 text-xs italic font-medium text-balance">
                {isEn 
                  ? "💡 Click any keyword above to edit response text and triggers." 
                  : "💡 กดที่ Keyword ด้านบนเพื่อเข้าไปแก้ไขข้อความตอบกลับและการทำงาน"}
              </div>
            </div>
          )}
        </div>

        {/* Global Save Section */}
        {keywords.length > 0 && (
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5 items-center">
                <div className="w-6 h-6 rounded-full border border-white bg-blue-600 flex items-center justify-center shadow-xs">
                  <FaFacebook className="h-3.5 w-3.5 text-white fill-white" />
                </div>
                <div className="w-6 h-6 rounded-full border border-white bg-linear-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-xs">
                  <FaInstagram className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-slate-500 text-[13px] font-medium">
                {isEn ? (
                  <>
                    Found <span className="text-slate-900 font-semibold">{keywords.length} active rules</span> ready
                  </>
                ) : (
                  <>
                    พบ{" "}
                    <span className="text-slate-900 font-semibold">
                      {keywords.length} ชุดคำสั่ง
                    </span>{" "}
                    ที่พร้อมทำงาน
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <KeywordEditorDialog
        open={editingIndex !== null}
        onClose={closeDialog}
        editingIndex={editingIndex}
        item={editingIndex !== null ? keywords[editingIndex] : undefined}
        isDuplicate={editingIndex !== null ? isDuplicate(editingIndex) : false}
        isGenerating={editingIndex !== null && isGenerating === `dm-${editingIndex}`}
        onUpdate={(data) => editingIndex !== null && updateRow(editingIndex, data)}
        onRemove={() => {
          if (editingIndex !== null) {
            removeRow(editingIndex);
            closeDialog();
          }
        }}
        onAiGenerate={() => editingIndex !== null && handleAiGenerate("KEYWORD_DM", editingIndex)}
        renderTemplate={renderTemplate}
      />
    </Card>
  );
}

