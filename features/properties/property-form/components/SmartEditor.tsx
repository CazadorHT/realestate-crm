import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import { toast } from "sonner";
import { Toolbar } from "./smart-editor/Toolbar";

interface SmartEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  height?: number | string;
  onAiGenerate?: (currentValue: string) => Promise<string>;
  onAiApply?: () => void;
}

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Wand2,
  FileEdit,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { startProcess, finishProcess } from "@/lib/process-monitor";

export function SmartEditor({
  value,
  onChange,
  disabled,
  placeholder,
  height,
  onAiGenerate,
  onAiApply,
}: SmartEditorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lineHeight, setLineHeight] = useState("leading-relaxed");
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [showAiReview, setShowAiReview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      CharacterCount,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none p-4 focus:outline-none focus:ring-0 min-h-[400px] ${lineHeight}`,
      },
    },
    editable: !disabled,
  });

  // Sync editor content when value changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Update line height dynamically
  React.useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `prose prose-sm max-w-none p-4 focus:outline-none focus:ring-0 min-h-[400px] ${lineHeight}`,
          },
        },
      });
    }
  }, [lineHeight, editor]);

  if (!editor) {
    return null;
  }

  const handleAiGenerate = async () => {
    const processId = startProcess("AI กำลังวิเคราะห์ข้อมูลทรัพย์สิน", {
      type: "AI_GENERATION",
      onRetry: handleAiGenerate,
    });
    setIsAiLoading(true);

    try {
      if (onAiGenerate) {
        // AI Logic
        const content = await onAiGenerate(editor.getHTML());
        if (content) {
          setAiDraft(content);
          setShowAiReview(true);
          finishProcess(
            processId,
            "SUCCESS",
            "ร่างข้อมูลอสังหาฯ สำเร็จ! กรุณาตรวจสอบความถูกต้อง ✨",
          );
        } else {
          finishProcess(
            processId,
            "ERROR",
            "AI ไม่สามารถสร้างเนื้อหาได้ในขณะนี้",
          );
        }
      } else {
        // Dummy logic if no provider (Fallback)
        setAiDraft(`
          <h2>🏗️ จุดเด่นโครงการ</h2>
          <ul>
            <li>ราคาสุดพิเศษ เหมาะลงทุนหรือพักอาศัย</li>
            <li>การเดินทางสะดวก เข้าออกได้หลายเส้นทาง</li>
            <li>พื้นที่ใช้สอยกว้างขวาง จัดสัดส่วนได้ลงตัว</li>
          </ul>
        `);
        setShowAiReview(true);
        finishProcess(processId, "SUCCESS", "ร่างข้อมูลสำเร็จ (โหมดจำลอง) ✨");
      }
    } catch (error: unknown) {
      console.error("AI Generation failed:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้";
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiDraft = () => {
    if (aiDraft) {
      editor.commands.setContent(aiDraft);
      setShowAiReview(false);
      setAiDraft(null);
      if (onAiApply) {
        onAiApply();
      }
      toast.success("บันทึกคำบรรยายทรัพย์เรียบร้อยแล้ว ✨");
    }
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white shadow-sm transition-[border,box-shadow] duration-200 focus-within:border-slate-300 focus-within:shadow-md flex flex-col overflow-hidden resize-y min-h-[300px]"
      style={{ height: height || 650 }}
    >
      <Toolbar
        editor={editor}
        disabled={disabled}
        isAiLoading={isAiLoading}
        onAiGenerate={handleAiGenerate}
        setLineHeight={setLineHeight}
      />

      <div className="overflow-y-auto flex-1 bg-slate-50/20 custom-scrollbar">
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between rounded-b-xl">
        <span>{editor.storage.characterCount?.words?.() ?? 0} words</span>
        <span>AI Writer Supported</span>
      </div>

      <ResponsiveDialog
        open={showAiReview}
        onOpenChange={setShowAiReview}
        title="AI Preview & Audit"
        description="กรุณาตรวจสอบความถูกต้องก่อนบันทึกข้อมูลประกาศ"
        className="sm:max-w-[700px]"
        snapPoints={["0.95"]}
      >
        <div className="flex flex-col gap-0 -mx-6 -mt-4">
          {/* Safety Verification Badge */}
          <div className="mx-6 my-4 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3.5 shadow-xs">
            <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-orange-900 leading-none flex items-center gap-2">
                ⚠️ จุดที่ต้องระวัง (AI Checklist)
              </p>
              <div className="text-xs text-orange-800 leading-relaxed font-medium">
                <ul className="list-disc list-inside space-y-1">
                  <li>ราคาประกาศนี้ (Price) ตรงกับความต้องการหรือไม่?</li>
                  <li>ขนาดพื้นที่ (Area Size) ไม่ได้ถูกแต่งเติมขึ้นเอง?</li>
                  <li>สถานะการขาย/เช่า และกฎบริษัทครบถ้วน?</li>
                </ul>
              </div>
            </div>
          </div>

          {/* AI Output Content */}
          <div className="px-6 pb-8">
            <div className="flex items-center gap-2 mb-3">
              <FileEdit className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                AI Generated Draft
              </span>
            </div>
            <div
              className="p-6 bg-white border-2 border-indigo-50 rounded-2xl prose prose-sm max-w-none text-slate-700 shadow-sm transition-all focus-within:border-indigo-100 focus-within:ring-4 focus-within:ring-indigo-50/50"
              contentEditable
              dangerouslySetInnerHTML={{ __html: aiDraft || "" }}
              onBlur={(e) => setAiDraft(e.currentTarget.innerHTML)}
              suppressContentEditableWarning
            />
            <p className="mt-3 text-[10px] text-slate-400 italic text-center">
              💡 เคล็ดลับ: คุณสามารถแก้ไขข้อความด้านบนได้ทันที
              ก่อนกดยืนยันใช้งาน
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            onClick={() => setShowAiReview(false)}
            className="flex-1 h-12 rounded-xl border-slate-200"
          >
            แก้ไขใหม่ (Cancel)
          </Button>
          <Button
            onClick={applyAiDraft}
            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 font-bold gap-2 px-8"
          >
            <ClipboardCheck className="h-4 w-4" />
            ยืนยันและใช้งาน
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
