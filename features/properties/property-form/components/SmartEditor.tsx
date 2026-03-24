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
}

export function SmartEditor({
  value,
  onChange,
  disabled,
  placeholder,
  height,
  onAiGenerate,
}: SmartEditorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lineHeight, setLineHeight] = useState("leading-relaxed");

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
    setIsAiLoading(true);
    const toastId = toast.loading("AI กำลังเรียบเรียงคำบรรยายให้คุณ... กรุณารอสักครู่ครับ");

    try {
      if (onAiGenerate) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const content = await onAiGenerate(editor.getHTML());
        if (content) {
          editor.commands.setContent(content);
          toast.success("เขียนคำบรรยายสำเร็จ! ✨", { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
      } else {
        setTimeout(() => {
          editor.commands.insertContent(`
            <h3>✨ จุดเด่นที่น่าสนใจ (AI Draft)</h3>
            <ul>
                <li>ทำเลศักยภาพ เดินทางสะดวก เข้าถึงสิ่งอำนวยความสะดวกได้ง่าย</li>
                <li>การตกแต่งทันสมัย วัสดุพรีเมียม ตอบโจทย์ทุกไลฟ์สไตล์</li>
                <li>ราคาคุ้มค่า เหมาะสำหรับอยู่อาศัยเองหรือลงทุนปล่อยเช่า</li>
            </ul>
          `);
          toast.success("ร่างเนื้อหาสำเร็จ! ✨", { id: toastId });
        }, 1000);
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      toast.error("ไม่สามารถสร้างเนื้อหาได้ในขณะนี้", { id: toastId });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white shadow-sm transition-[border,box-shadow] duration-200 focus-within:border-slate-300 focus-within:shadow-md flex flex-col overflow-hidden"
      style={{ height: height || 650 }}
    >
      <Toolbar 
        editor={editor}
        disabled={disabled}
        isAiLoading={isAiLoading}
        onAiGenerate={handleAiGenerate}
        setLineHeight={setLineHeight}
      />

      {/* Editor Content Scroll Container */}
      <div className="overflow-y-auto flex-1 bg-slate-50/20 custom-scrollbar">
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between rounded-b-xl">
        <span>{editor.storage.characterCount?.words?.() ?? 0} words</span>
        <span>Markdown supported</span>
      </div>
    </div>
  );
}
