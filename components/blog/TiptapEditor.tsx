import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useCallback } from "react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Toggle } from "@/components/ui/toggle";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { uploadBlogImage } from "@/features/blog/services/storage-service";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const handleImageUpload = useCallback(async (file: File) => {
    const toastId = toast.loading(isEn ? "Uploading and optimizing image..." : "กำลังอัปโหลดและปรับแต่งรูปภาพ...");
    try {
      const response = await uploadBlogImage(file, file.name, file.type);
      if (response.success && response.data) {
        toast.success(isEn ? "Image uploaded successfully (WebP Optimized)" : "อัปโหลดรูปภาพเรียบร้อยแล้ว (WebP Optimized)", { id: toastId });
        return response.data.publicUrl;
      }
      throw new Error(response.message);
    } catch (error) {
      toast.error(isEn ? "Failed to upload image" : "อัปโหลดรูปภาพไม่สำเร็จ", { id: toastId });
      return null;
    }
  }, [isEn]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-2xl shadow-lg border border-slate-100 my-8 mx-auto hover:scale-[1.01] transition-transform duration-500 cursor-zoom-in max-w-2xl w-full max-h-[600px] object-contain",
        },
      }),
      Link.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            class: {
              default: null,
              parseHTML: (element) => element.getAttribute("class"),
              renderHTML: (attributes) => {
                return {
                  class: attributes.class,
                };
              },
            },
          };
        },
      }).configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full border border-slate-200 my-4",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[400px] max-h-[600px] overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none prose-img:mx-auto prose-img:rounded-2xl",
      },
      // 🛠️ Handle Drag and Drop
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault(); // Stop default browser behavior
            handleImageUpload(file).then(url => {
              if (url) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
      },
      // 🛠️ Handle Paste
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const files = Array.from(event.clipboardData?.files || []);
        
        // Handle image files in clipboard
        const imageFile = files.find(f => f.type.startsWith("image/")) || 
                          items.find(item => item.type.startsWith("image/"))?.getAsFile();

        if (imageFile) {
          event.preventDefault();
          handleImageUpload(imageFile as File).then(url => {
            if (url) {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            }
          });
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content when value prop changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.isFocused) return;

    const currentContent = editor.getHTML();
    if (currentContent !== value) {
      const timeoutId = setTimeout(() => {
        if (!editor.isDestroyed && !editor.isFocused) {
          editor.commands.setContent(value || "", { emitUpdate: false }); 
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        const url = await handleImageUpload(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    };
    input.click();
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
    <div className="flex flex-col gap-2 rounded-md border border-input bg-transparent overflow-hidden group">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2 bg-slate-50/50">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          className="data-[state=on]:bg-white data-[state=on]:text-blue-600"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          className="data-[state=on]:bg-white data-[state=on]:text-blue-600"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          className="data-[state=on]:bg-white data-[state=on]:text-blue-600"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <div className="w-px h-6 bg-border mx-1" />
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="data-[state=on]:bg-white data-[state=on]:text-blue-600"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="data-[state=on]:bg-white data-[state=on]:text-blue-600"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
        <div className="w-px h-6 bg-border mx-1" />
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <div className="w-px h-6 bg-border mx-1" />
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        
        {/* 📸 Optimized Image Upload Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 w-8 p-0 hover:bg-white hover:text-blue-600"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={setLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>

        <div className="ml-auto flex items-center gap-1">
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="p-0" />
      
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 text-[10px] text-slate-400 flex items-center gap-4">
        <span>
          {isEn
            ? "💡 TIP: Paste images or drag & drop files directly into the editor for automatic WebP optimization."
            : "💡 TIP: วางรูปภาพ หรือลากไฟล์มาวางใน Editor เพื่ออัปโหลดและปรับแต่งอัตโนมัติ"}
        </span>
      </div>
    </div>
  );
}

