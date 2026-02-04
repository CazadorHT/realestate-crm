"use client";

import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Sparkles,
  Smile,
  LayoutTemplate,
  ChevronDown,
  Heading2,
  Heading3,
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
import { Separator } from "@/components/ui/separator";

interface SmartEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onAiGenerate?: (currentValue: string) => Promise<string>;
}

const TEMPLATES = [
  {
    label: "คอนโด (ปล่อยเช่า)",
    content: `
      <h3>🔥 ปล่อยเช่าคอนโด [ชื่อโครงการ] แต่งสวย พร้อมอยู่!</h3>
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
      <h3>🔥 ขายคอนโด [ชื่อโครงการ] ห้องสวย ราคาดี กู้ได้เต็ม!</h3>
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
      <h3>🏘️ ขายบ้านเดี่ยว [ชื่อหมู่บ้าน] สภาพนางฟ้า ทำเลทอง</h3>
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
      <h3>🏢 ขายทาวน์โฮม [ชื่อโครงการ] หน้ากว้าง [5.7] เมตร ต่อเติมครบ</h3>
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
  const [lineHeight, setLineHeight] = useState("leading-relaxed");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none p-4 focus:outline-none focus:ring-0 min-h-[800px] ${lineHeight}`,
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
            class: `prose prose-sm max-w-none p-4 focus:outline-none focus:ring-0 min-h-[800px] ${lineHeight}`,
          },
        },
      });
    }
  }, [lineHeight, editor]);

  if (!editor) {
    return null;
  }

  const insertTemplate = (content: string) => {
    editor.commands.insertContent(content);
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleAiGenerate = async () => {
    setIsAiLoading(true);

    try {
      if (onAiGenerate) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const content = await onAiGenerate(editor.getHTML());
        if (content) {
          editor.commands.setContent(content);
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
        }, 1000);
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-[border,box-shadow] duration-200 focus-within:border-slate-300 focus-within:shadow-md h-[650px] flex flex-col">
      {/* Toolbar */}
      <div className="bg-slate-50/80 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1.5 backdrop-blur-sm z-10 sticky top-0 rounded-t-xl">
        {/* History */}
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

        {/* Headings */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("heading", { level: 2 })
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`h-7 w-7 p-0 rounded-md ${
              editor.isActive("heading", { level: 3 })
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }`}
            disabled={disabled}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Text Style */}
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

        {/* Lists */}
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

        {/* Templates */}
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

        {/* Emoji Picker */}
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

        {/* Line Height Control */}
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

        <div className="flex-1" />

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
          className="h-7 w-7 p-0 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 mr-1"
          title="Clear Content"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

        {/* AI Generate Button */}
        <Button
          type="button"
          size="sm"
          onClick={handleAiGenerate}
          disabled={disabled || isAiLoading}
          className={`
            h-7 gap-1.5 text-xs font-medium transition-all px-3
            ${
              isAiLoading
                ? "bg-slate-100 text-slate-400"
                : "bg-linear-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 shadow-sm"
            }
          `}
        >
          <Sparkles
            className={`h-3.5 w-3.5 ${isAiLoading ? "animate-spin" : ""}`}
          />
          {isAiLoading ? "Writing..." : "AI Writer"}
        </Button>
      </div>

      {/* Editor Content Scroll Container */}
      <div className="overflow-y-auto flex-1 bg-slate-50/20">
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {/* Footer Info (Optional) */}
      <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between rounded-b-xl">
        <span>{editor.storage.characterCount?.words?.() ?? 0} words</span>
        <span>Markdown supported</span>
      </div>
    </div>
  );
}
