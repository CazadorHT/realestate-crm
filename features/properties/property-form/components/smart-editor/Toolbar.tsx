"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Sparkles,
  Smile,
  LayoutTemplate,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Palette,
  Link as LinkIcon,
  Undo,
  Redo,
  Unlink,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import { TEMPLATES } from "./constants";
import type { EmojiClickData } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="h-87.5 w-[320px] bg-slate-50 animate-pulse rounded-lg" />
  ),
});

interface ToolbarProps {
  editor: Editor;
  disabled?: boolean;
  isAiLoading: boolean;
  onAiGenerate: () => void;
  setLineHeight: (height: string) => void;
}

export function Toolbar({
  editor,
  disabled,
  isAiLoading,
  onAiGenerate,
  setLineHeight,
}: ToolbarProps) {
  const insertTemplate = (content: string) => {
    editor.commands.insertContent(content);
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="bg-slate-50/80 border-b border-slate-200 p-2 flex items-center gap-1.5 backdrop-blur-sm z-10 sticky top-0 rounded-t-xl overflow-x-auto">
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || disabled}
            className="h-7 w-7 p-0"
            title="Undo"
          >
            <Undo className="h-3.5 w-3.5 text-slate-500" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || disabled}
            className="h-7 w-7 p-0"
            title="Redo"
          >
            <Redo className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5 bg-slate-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs font-semibold text-slate-600 bg-white px-2 border-slate-200 shadow-sm"
            >
              <span>
                {editor.isActive("heading", { level: 1 }) ? "H1" :
                 editor.isActive("heading", { level: 2 }) ? "H2" :
                 editor.isActive("heading", { level: 3 }) ? "H3" :
                 editor.isActive("heading", { level: 4 }) ? "H4" : "Paragraph"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              ปกติ (Paragraph)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="font-extrabold text-lg">
              <Heading1 className="h-4 w-4 mr-2" /> หัวข้อใหญ่ (H1)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="font-bold text-base">
              <Heading2 className="h-4 w-4 mr-2" /> หัวข้อย่อยหลัก (H2)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="font-semibold text-sm">
              <Heading3 className="h-4 w-4 mr-2" /> หัวข้อย่อยรอง (H3)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className="font-normal text-xs">
              <Heading4 className="h-4 w-4 mr-2" /> หัวข้อย่อยเล็ก (H4)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs font-semibold bg-white px-2 border-slate-200 shadow-sm "
              title="Text Color"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>สีข้อความ</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-2 grid grid-cols-5 gap-1 w-44">
            {[
              { color: "#000000", label: "Default" },
              { color: "#ef4444", label: "Red" },
              { color: "#e11d48", label: "Rose" },
              { color: "#ea580c", label: "Orange" },
              { color: "#ca8a04", label: "Gold" },
              { color: "#16a34a", label: "Green" },
              { color: "#2563eb", label: "Blue" },
              { color: "#4f46e5", label: "Indigo" },
              { color: "#7c3aed", label: "Purple" },
              { color: "#db2777", label: "Pink" },
              { color: "#475569", label: "Slate" }
            ].map((item) => (
              <button
                key={item.color}
                type="button"
                onClick={() => (editor.chain().focus() as any).setColor(item.color).run()}
                className="w-6 h-6 rounded-md border border-slate-200 transition-transform active:scale-90 hover:scale-105"
                style={{ backgroundColor: item.color }}
                title={item.label}
              />
            ))}
            <button
              type="button"
              onClick={() => (editor.chain().focus() as any).unsetColor().run()}
              className="col-span-5 text-[10px] font-bold text-slate-400 hover:text-red-500 py-1 text-center border border-slate-100 rounded-md mt-1"
            >
              ล้างสี (Reset)
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("bold")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("italic")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("strike")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("link")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
          {editor.isActive("link") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-red-500"
              disabled={disabled}
              title="Remove Link"
            >
              <Unlink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("bulletList")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("orderedList")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Ordered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5 bg-slate-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs font-medium text-slate-600 bg-white px-2"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Templates
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TEMPLATES.map((template) => (
              <DropdownMenuItem
                key={template.label}
                onClick={() => insertTemplate(template.content)}
                className="gap-2 cursor-pointer"
              >
                <LayoutTemplate className="h-3.5 w-3.5 opacity-70" />
                {template.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded-md bg-white text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200"
              title="Add Emoji"
            >
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 border-none shadow-xl z-50"
            align="start"
          >
            <EmojiPicker
              onEmojiClick={(emoji: EmojiClickData) => {
                editor.commands.insertContent(emoji.emoji);
              }}
              width={320}
              height={350}
              searchDisabled={false}
              skinTonesDisabled
              previewConfig={{ showPreview: false }}
            />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-md text-slate-500"
              title="Line Height"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setLineHeight("leading-none")}>
              None (1.0)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLineHeight("leading-tight")}>
              Tight (1.25)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLineHeight("leading-snug")}>
              Snug (1.375)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLineHeight("leading-normal")}>
              Normal (1.5)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLineHeight("leading-relaxed")}>
              Relaxed (1.625)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLineHeight("leading-loose")}>
              Loose (2.0)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-w-0" />

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm("Are you sure you want to clear the content?")) {
              editor.commands.clearContent();
            }
          }}
          disabled={disabled}
          className="h-7 w-7 p-0 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
          title="Clear Content"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

      </div>
    </div>
  );
}
