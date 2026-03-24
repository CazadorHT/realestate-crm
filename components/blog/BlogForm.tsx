"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Save,
  FileJson,
  Calendar as CalendarIcon,
  Globe,
  ArrowLeft,
  Eye,
  EyeOff,
  Tag,
  Image as ImageIcon,
  FileText,
  Search,
  ChevronRight,
  Sparkles,
  Type,
  Link2,
  ExternalLink,
  List,
  Languages,
} from "lucide-react";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { blogPostSchema } from "@/features/blog/schema";
import { BlogPostInput, BlogPostRow } from "@/features/blog/types";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/features/blog/actions";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const TiptapEditor = dynamic(() => import("./TiptapEditor").then(mod => mod.TiptapEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-md border border-input" />
});
import { CategoryDialog } from "./CategoryDialog";
import { BlogImageUploader } from "./BlogImageUploader";
import { BlogAiGenerator } from "./BlogAiGenerator";
import { BlogContentRefiner } from "./BlogContentRefiner";

// Modular Sub-components
import { BlogHeader } from "./blog-form/BlogHeader";
import { BlogContentTab } from "./blog-form/BlogContentTab";
import { BlogMediaTab } from "./blog-form/BlogMediaTab";
import { BlogSeoTab } from "./blog-form/BlogSeoTab";
import { BlogStickyBottom } from "./blog-form/BlogStickyBottom";
import { BlogSuccessDialog } from "./blog-form/BlogSuccessDialog";

interface BlogFormProps {
  initialData?: BlogPostRow;
  categories?: { id: string; name: string }[];
}

export function BlogForm({ initialData, categories = [] }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [successData, setSuccessData] = useState<{
    slug: string;
  } | null>(null);

  // Convert JSONB structured_data to string for the form
  const initialStructuredData = initialData?.structured_data
    ? JSON.stringify(initialData.structured_data, null, 2)
    : "";

  const defaultValues: Partial<BlogPostInput> = initialData
    ? {
        title: initialData.title,
        slug: initialData.slug,
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        category: initialData.category || "General",
        cover_image: initialData.cover_image || "",
        tags: Array.isArray(initialData.tags)
          ? initialData.tags.join(", ")
          : "",
        is_published: initialData.is_published || false,
        structured_data: initialStructuredData,
        published_at: initialData.published_at || undefined,
        title_en: initialData.title_en || "",
        title_cn: initialData.title_cn || "",
        excerpt_en: initialData.excerpt_en || "",
        excerpt_cn: initialData.excerpt_cn || "",
        content_en: initialData.content_en || "",
        content_cn: initialData.content_cn || "",
      }
    : {
        title: "",
        title_en: "",
        title_cn: "",
        slug: "",
        excerpt: "",
        excerpt_en: "",
        excerpt_cn: "",
        content: "",
        content_en: "",
        content_cn: "",
        category: "General",
        cover_image: "",
        tags: "",
        is_published: false,
        structured_data: "",
      };

  const form = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema) as unknown as Resolver<any>,
    mode: "onChange",
    defaultValues,
  });

  const { watch, setValue } = form;
  const watchedTitle = watch("title");
  const watchedContent = watch("content");
  const watchedExcerpt = watch("excerpt");
  const watchedSlug = watch("slug");
  const watchedIsPublished = watch("is_published");
  const watchedCoverImage = watch("cover_image");

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    if (!initialData) {
      const slug = title
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      setValue("slug", slug);
    }
  };

  const [importJsonOpen, setImportJsonOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      Object.keys(data).forEach((key) => {
        if (key in defaultValues) {
          setValue(key as keyof BlogPostInput, data[key]);
        }
      });

      if (data.structured_data && typeof data.structured_data === "object") {
        setValue(
          "structured_data",
          JSON.stringify(data.structured_data, null, 2),
        );
      }

      toast.success("นำเข้าข้อมูลสำเร็จ");
      setImportJsonOpen(false);
    } catch (e) {
      toast.error("รูปแบบ JSON ไม่ถูกต้อง");
    }
  };

  const generateJsonLd = () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: watchedTitle,
      description: watchedExcerpt,
      datePublished: new Date().toISOString(),
      author: {
        "@type": "Person",
        name: "Admin",
      },
    };
    setValue("structured_data", JSON.stringify(jsonLd, null, 2));
    toast.success("สร้าง JSON-LD สำเร็จ");
  };

  const handleAiGenerated = (data: any) => {
    if (!data) return;

    if (data.title) setValue("title", data.title);
    if (data.slug) setValue("slug", data.slug);
    if (data.excerpt) setValue("excerpt", data.excerpt);
    if (data.content) setValue("content", data.content);
    if (data.tags) setValue("tags", data.tags);
    if (data.structured_data) {
      setValue(
        "structured_data",
        JSON.stringify(data.structured_data, null, 2),
      );
    }

    toast.success(
      "ข้อมูลบทความถูกเติมลงในฟอร์มเรียบร้อยแล้ว ✨ อย่าลืมตรวจสอบเนื้อหาก่อนบันทึกนะครับ",
    );
  };

  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateBlog = async () => {
    const title = form.getValues("title");
    const excerpt = form.getValues("excerpt");
    const content = form.getValues("content");

    if (!title || title.trim() === "") {
      toast.error("กรุณากรอกหัวข้อภาษาไทยก่อนกดแปลครับ");
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading(
      "กำลังแปลเนื้อหาบทความเป็นภาษาอังกฤษและจีน...",
    );

    try {
      // 1. Translate Title (Plain)
      const titleRes = await translateTextAction(title, "plain");
      form.setValue("title_en", titleRes.en, { shouldDirty: true });
      form.setValue("title_cn", titleRes.cn, { shouldDirty: true });

      // 2. Translate Excerpt (Plain)
      if (excerpt && excerpt.trim() !== "") {
        const excerptRes = await translateTextAction(excerpt, "plain");
        form.setValue("excerpt_en", excerptRes.en, { shouldDirty: true });
        form.setValue("excerpt_cn", excerptRes.cn, { shouldDirty: true });
      }

      // 3. Translate Content (HTML)
      if (content && content.trim() !== "" && content !== "<p></p>") {
        const contentRes = await translateTextAction(content, "html");
        form.setValue("content_en", contentRes.en, { shouldDirty: true });
        form.setValue("content_cn", contentRes.cn, { shouldDirty: true });
      }

      toast.success("แปลเนื้อหาบทความเรียบร้อยแล้ว ✨", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "การแปลขัดข้อง", { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  async function onSubmit(data: BlogPostInput) {
    setIsSubmitting(true);
    try {
      let res;
      if (initialData) {
        res = await updateBlogPostAction(initialData.id, data);
      } else {
        res = await createBlogPostAction(data);
      }

      if (res.success) {
        toast.success(res.message);
        // router.push("/protected/blogs");
        // router.refresh();
        setSuccessData({ slug: data.slug });
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  }

  const characterCount = (watchedContent || "").replace(
    /<[^>]*>?/gm,
    "",
  ).length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-20">
        <BlogHeader
          form={form}
          isNew={!initialData}
          isSubmitting={isSubmitting}
          characterCount={characterCount}
          onAiGenerated={handleAiGenerated}
          importJsonOpen={importJsonOpen}
          setImportJsonOpen={setImportJsonOpen}
          jsonInput={jsonInput}
          setJsonInput={setJsonInput}
          onImport={handleImport}
        />

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 rounded-xl h-14 md:h-20 p-1">
            <TabsTrigger
              value="content"
              className="gap-2 rounded-lg py-2 md:py-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden xs:inline">เนื้อหา</span>
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="gap-2 rounded-lg py-2 md:py-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden xs:inline">รูปภาพ</span>
              <span className="hidden md:inline">& หมวดหมู่</span>
            </TabsTrigger>
            <TabsTrigger
              value="seo"
              className="gap-2 rounded-lg py-2 md:py-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
            >
              <Search className="h-4 w-4" />
              <span className="hidden xs:inline">SEO</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <BlogContentTab
              form={form}
              isTranslating={isTranslating}
              onTranslate={handleTranslateBlog}
              onTitleChange={handleTitleChange}
            />
          </TabsContent>

          <TabsContent value="media">
            <BlogMediaTab form={form} categories={categories} />
          </TabsContent>

          <TabsContent value="seo">
            <BlogSeoTab form={form} onGenerateJsonLd={generateJsonLd} />
          </TabsContent>
        </Tabs>

        <BlogStickyBottom
          form={form}
          isSubmitting={isSubmitting}
          characterCount={characterCount}
        />

        <BlogSuccessDialog
          successData={successData}
          onOpenChange={(open: boolean) => !open && setSuccessData(null)}
        />
      </form>
    </Form>
  );
}
