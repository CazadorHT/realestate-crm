"use client";

import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Sparkles,
  Smile,
  Type,
  LayoutTemplate,
  ChevronDown,
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
import { Separator } from "@/components/ui/separator";

interface SmartEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onAiGenerate?: () => Promise<string>;
}

const TEMPLATES = [
  {
    label: "คอนโด (ปล่อยเช่า)",
    content: `
      <p><strong>🔥 ปล่อยเช่าคอนโด [ชื่อโครงการ] แต่งสวย พร้อมอยู่!</strong></p>
      <p>📍 ทำเลดี ใกล้ BTS/MRT [สถานี...] เดินทางสะดวก</p>
      <ul>
        <li>🛏️ รูปแบบ: [1 Bedroom] ขนาด [35 ตร.ม.]</li>
        <li>🏢 ชั้น: [15] วิวสวย ไม่บล็อก</li>
        <li>🛋️ เฟอร์นิเจอร์ + เครื่องใช้ไฟฟ้าครบ (แอร์, ตู้เย็น, เครื่องซักผ้า)</li>
      </ul>
      <p>💰 <strong>ค่าเช่า: [15,000] บาท/เดือน</strong> (สัญญา 1 ปี)</p>
      <p>📞 สนใจติดต่อ: [เบอร์โทร] หรือ Line: [Line ID]</p>
    `,
  },
  {
    label: "คอนโด (ขาย)",
    content: `
      <p><strong>🔥 ขายคอนโด [ชื่อโครงการ] ห้องสวย ราคาดี กู้ได้เต็ม!</strong></p>
      <p>📍 ทำเลศักยภาพ ใกล้ [ห้าง/รถไฟฟ้า] เหมาะทั้งอยู่เองและลงทุน</p>
      <ul>
        <li>🛏️ รูปแบบ: [2 Bedroom] ขนาด [55 ตร.ม.]</li>
        <li>🏢 ชั้น: [สูง] ทิศ [เหนือ/ใต้] ลมดี</li>
        <li>✨ สภาพห้อง: ตกแต่งใหม่ / เฟอร์ฯครบ พร้อมหิ้วกระเป๋าเข้าอยู่</li>
      </ul>
      <p>💰 <strong>ราคาขาย: [3.xx] ล้านบาท</strong> (คุ้มมาก ถูกกว่าตลาด)</p>
      <p>📞 สนใจนัดชมห้อง: [เบอร์โทร] หรือ Line: [Line ID]</p>
    `,
  },
  {
    label: "บ้านเดี่ยว (ขาย)",
    content: `
      <p><strong>🏘️ ขายบ้านเดี่ยว [ชื่อหมู่บ้าน] สภาพนางฟ้า ทำเลทอง</strong></p>
      <p>✨ จุดเด่น: บ้านหลังมุม พื้นที่เยอะ รีโนเวทใหม่ทั้งหลัง</p>
      <ul>
        <li>📐 พื้นที่ใช้สอย: [200 ตร.ม.] | เนื้อที่ [60 ตร.ว.]</li>
        <li>🚗 ที่จอดรถ: [2] คัน</li>
        <li>🏡 ฟังก์ชัน: [3] ห้องนอน [3] ห้องน้ำ</li>
      </ul>
      <p>📍 สถานที่ใกล้เคียง: [ห้างสรรพสินค้า], [โรงเรียน], [ทางด่วน]</p>
      <p>💰 <strong>ราคาขาย: [5.xx] ล้านบาท</strong> (ค่าโอนคนละครึ่ง)</p>
      <p>📞 นัดชมบ้าน: [เบอร์โทร]</p>
    `,
  },
  {
    label: "ทาวน์โฮม (ขาย/โฮมออฟฟิศ)",
    content: `
      <p><strong>🏢 ขายทาวน์โฮม [ชื่อโครงการ] หน้ากว้าง [5.7] เมตร ต่อเติมครบ</strong></p>
      <p>✨ เหมาะสำหรับทำโฮมออฟฟิศ หรืออยู่อาศัย สภาพดีมาก</p>
      <ul>
        <li>📐 เนื้อที่ [20 ตร.ว.] พื้นที่ใช้สอย [130 ตร.ม.]</li>
        <li>🚘 จอดรถในบ้านได้ [2] คัน</li>
        <li>🛠️ ต่อเติม: หลังคาโรงจอดรถ, ครัวหลังบ้าน ลงเสาเข็มไมโครไพล์</li>
      </ul>
      <p>📍 เดินทางสะดวกเข้าออกได้หลายทาง ใกล้ [ชื่อถนน/ทางด่วน]</p>
      <p>💰 <strong>ราคาเพียง: [2.xx] ล้านบาท</strong></p>
      <p>📞 สนใจติดต่อ: [เบอร์โทร]</p>
    `,
  },
];

export function SmartEditor({
  value,
  onChange,
  disabled,
  placeholder,
  onAiGenerate,
}: SmartEditorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false, // Fix hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-4 focus:outline-none focus:ring-0 leading-relaxed",
      },
    },
    editable: !disabled,
  });

  if (!editor) {
    return null;
  }

  const insertTemplate = (content: string) => {
    editor.commands.insertContent(content);
  };

  const handleAiGenerate = async () => {
    setIsAiLoading(true);

    try {
      if (onAiGenerate) {
        // Wait a bit to simulate "thinking" to feel more AI-like
        await new Promise((resolve) => setTimeout(resolve, 800));
        const content = await onAiGenerate();
        if (content) {
          editor.commands.setContent(content);
        }
      } else {
        // Fallback Mock AI generation
        setTimeout(() => {
          editor.commands.insertContent(`
            <p>✨ <strong>(AI Draft) จุดเด่นที่น่าสนใจ:</strong></p>
            <ul>
                <li>ทำเลศักยภาพ เดินทางสะดวก ข้าถึงสิ่งอำนวยความสะดวกได้ง่าย</li>
                <li>การตกแต่งทันสมัย วัสดุพรีเมียม ตอบโจทย์ทุกไลฟ์สไตล์</li>
                <li>ราคาคุ้มค่า เหมาะสำหรับอยู่อาศัยเองหรือลงทุนปล่อยเช่า</li>
            </ul>
          `);
        }, 1000);
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-[border,box-shadow] duration-200 focus-within:border-slate-200 focus-within:shadow-md resize-y h-[400px] overflow-auto">
      {/* Toolbar */}
      <div className="bg-slate-50/80 border-b border-slate-100 p-2 flex flex-wrap items-center gap-1.5 sticky top-0 z-10">
        {/* Formatting */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("bold")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("italic")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("bulletList")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("orderedList")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Templates */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-xs font-medium text-slate-600 bg-white"
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

        {/* Emoji Picker */}
        <Popover>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-full bg-white text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200"
              title="Add Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 border-none shadow-xl"
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

        <div className="flex-1" />

        {/* AI Generate Button */}
        <Button
          type="button"
          size="sm"
          onClick={handleAiGenerate}
          disabled={disabled || isAiLoading}
          className={`
            h-8 gap-1.5 text-xs font-medium transition-all
            ${
              isAiLoading
                ? "bg-slate-100 text-slate-400"
                : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 shadow-sm"
            }
          `}
        >
          <Sparkles
            className={`h-3.5 w-3.5 ${isAiLoading ? "animate-spin" : ""}`}
          />
          {isAiLoading ? "Writing..." : "AI Writer"}
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white min-h-[200px]" />
    </div>
  );
}
