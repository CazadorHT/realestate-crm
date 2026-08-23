"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  Eraser,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useLanguage } from "@/lib/i18n/language-context";

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TipTapEditor({
  value,
  onChange,
  className,
  disabled = false,
}: TipTapEditorProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-disc pl-6 space-y-1 my-2",
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-decimal pl-6 space-y-1 my-2",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(DOMPurify.sanitize(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-hidden",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
        ),
      },
    },
  });

  // Sync value externally if changed
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt(isEn ? "Enter URL" : "ใส่ URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor, isEn]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 cursor-pointer", editor.isActive("bold") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title={isEn ? "Bold" : "ตัวหนา"}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 cursor-pointer", editor.isActive("italic") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title={isEn ? "Italic" : "ตัวเอียง"}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 cursor-pointer", editor.isActive("strike") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          title={isEn ? "Strikethrough" : "ขีดฆ่า"}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-500 cursor-pointer"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={disabled}
          title={isEn ? "Clear formatting" : "ล้างการจัดรูปแบบ"}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 cursor-pointer", editor.isActive("bulletList") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title={isEn ? "Bullet list" : "รายการแบบจุด"}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 cursor-pointer", editor.isActive("orderedList") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title={isEn ? "Numbered list" : "รายการแบบตัวเลข"}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 cursor-pointer", editor.isActive("link") && "bg-slate-200")}
          onClick={setLink}
          disabled={disabled}
          title={isEn ? "Insert link" : "เพิ่มลิงก์"}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={disabled || !editor.isActive("link")}
          title={isEn ? "Remove link" : "นำลิงก์ออก"}
        >
          <Unlink className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title={isEn ? "Undo" : "เลิกทำ"}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title={isEn ? "Redo" : "ทำซ้ำ"}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-0">
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose p {
          margin: 0.5rem 0;
        }
        .prose a {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
