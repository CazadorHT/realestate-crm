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
  placeholder,
  className,
  disabled = false,
}: TipTapEditorProps) {
  const sanitize = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "s", "strike", "del"],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Heading is usually too large for FAQ answers
        codeBlock: false,
        code: false,
        blockquote: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800 transition-colors",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(sanitize(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[150px] p-4 focus:outline-none",
          disabled && "opacity-50 cursor-not-allowed"
        ),
      },
    },
    immediatelyRender: false,
  });

  // Keep editor content in sync with external value changes (e.g. AI translation)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL ภาษาอังกฤษ (เช่น https://google.com)", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

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
          className={cn("h-8 w-8", editor.isActive("bold") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="ตัวหนา"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("italic") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="ตัวเอียง"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("strike") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          title="ขีดฆ่า"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-500"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={disabled}
          title="ล้างการจัดรูปแบบ"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("bulletList") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="รายการแบบจุด"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("orderedList") && "bg-slate-200")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title="รายการแบบตัวเลข"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("link") && "bg-slate-200")}
          onClick={setLink}
          disabled={disabled}
          title="เพิ่มลิงก์"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={disabled || !editor.isActive("link")}
          title="นำลิงก์ออก"
        >
          <Unlink className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="เลิกทำ"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="ทำซ้ำ"
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
