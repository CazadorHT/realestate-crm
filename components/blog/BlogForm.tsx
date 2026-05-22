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
import { AiReviewBanner } from "@/components/shared/AiReviewBanner";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { toast } from "sonner";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
import { BlogPostInput, BlogPostRow, BlogAiResult } from "@/features/blog/types";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/features/blog/actions";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { generateBlogSlug } from "@/features/blog/blog-utils";

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
  const [isAiGenerating, setIsAiGenerating] = useState(false);
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
        title_ru: initialData.title_ru || "",
        excerpt_en: initialData.excerpt_en || "",
        excerpt_cn: initialData.excerpt_cn || "",
        excerpt_ru: initialData.excerpt_ru || "",
        content_en: initialData.content_en || "",
        content_cn: initialData.content_cn || "",
        content_ru: initialData.content_ru || "",
        requires_ai_review: initialData.requires_ai_review || false,
      }
    : {
        title: "",
        title_en: "",
        title_cn: "",
        title_ru: "",
        slug: "",
        excerpt: "",
        excerpt_en: "",
        excerpt_cn: "",
        excerpt_ru: "",
        content: "",
        content_en: "",
        content_cn: "",
        content_ru: "",
        category: "General",
        cover_image: "",
        tags: "",
        is_published: false,
        structured_data: "",
        requires_ai_review: false,
      };

  const form = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema) as Resolver<BlogPostInput>,
    mode: "onChange",
    defaultValues,
  });

  const { watch, setValue } = form;
  
  // Only watch what's absolutely needed for the top-level UI logic
  const watchedTitle = watch("title");
  const watchedContent = watch("content");
  const watchedIsPublished = watch("is_published");

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    if (!initialData) {
      const slug = generateBlogSlug(title);
      setValue("slug", slug);
    }
  };

  const regenerateSlug = () => {
    const title = watch("title");
    if (title) {
      const slug = generateBlogSlug(title);
      setValue("slug", slug, { shouldDirty: true });
      toast.success("เจนเนอเรต URL ใหม่เรียบร้อย ✨");
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
  const handleAiGenerated = useCallback((data: BlogAiResult) => {
    if (!data) return;

    // 🛡️ Force UI to acknowledge AI data
    const options = { shouldDirty: true, shouldValidate: true };

    setValue("requires_ai_review", true, options);

    if (data.title) setValue("title", data.title, options);
    if (data.slug) setValue("slug", data.slug, options);
    if (data.excerpt) {
      const cleanExcerpt = data.excerpt.slice(0, 160);
      setValue("excerpt", cleanExcerpt, options);
    }
    if (data.content) setValue("content", data.content, options);
    if (data.category) setValue("category", data.category, options);
    if (data.tags) setValue("tags", data.tags, options);

    // Multilingual support
    if (data.title_en) setValue("title_en", data.title_en, options);
    if (data.title_cn) setValue("title_cn", data.title_cn, options);
    if (data.title_ru) setValue("title_ru", data.title_ru, options);
    
    if (data.excerpt_en) setValue("excerpt_en", data.excerpt_en.slice(0, 160), options);
    if (data.excerpt_cn) setValue("excerpt_cn", data.excerpt_cn.slice(0, 160), options);
    if (data.excerpt_ru) setValue("excerpt_ru", data.excerpt_ru.slice(0, 160), options);
    
    if (data.content_en) setValue("content_en", data.content_en, options);
    if (data.content_cn) setValue("content_cn", data.content_cn, options);
    if (data.content_ru) setValue("content_ru", data.content_ru, options);

    if (data.structured_data) {
      setValue(
        "structured_data",
        JSON.stringify(data.structured_data, null, 2),
        options
      );
    }

    const scoreMsg = data.seo_score ? ` (SEO Score: ${data.seo_score})` : "";
    toast.success(
      `ข้อมูลบทความ หมวดหมู่ และแท็ก ถูกเติมลงในฟอร์มเรียบร้อยแล้ว${scoreMsg} ✨`,
    );
    setIsAiGenerating(false);
  }, [setValue]);

  // 🛡️ BACKGROUND GENERATION HANDLER
  useEffect(() => {
    const handleStart = () => setIsAiGenerating(true);
    const handleError = () => setIsAiGenerating(false);
    const handleSuccess = (event: any) => {
      const data = event.detail;
      if (data) {
        handleAiGenerated(data);
      }
      setIsAiGenerating(false);
    };

    window.addEventListener("BLOG_AI_GENERATION_START", handleStart);
    window.addEventListener("BLOG_AI_GENERATION_ERROR", handleError);
    window.addEventListener("BLOG_AI_GENERATED_SUCCESS", handleSuccess);

    return () => {
      window.removeEventListener("BLOG_AI_GENERATION_START", handleStart);
      window.removeEventListener("BLOG_AI_GENERATION_ERROR", handleError);
      window.removeEventListener("BLOG_AI_GENERATED_SUCCESS", handleSuccess);
    };
  }, [handleAiGenerated]);

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
    const processId = startProcess("กำลังแปลเนื้อหาบทความ (AI Multilingual)", {
      type: "BLOG_TRANSLATION",
      onRetry: handleTranslateBlog
    });

    try {
      // 1. Translate Title (Plain)
      finishProcess(processId, "PROCESSING", "กำลังแปลหัวข้อบทความ...");
      const titleRes = await translateTextAction(title, "plain");
      form.setValue("title_en", titleRes.en, { shouldDirty: true });
      form.setValue("title_cn", titleRes.cn, { shouldDirty: true });
      form.setValue("title_ru", titleRes.ru, { shouldDirty: true });

      // 2. Translate Excerpt (Plain)
      if (excerpt && excerpt.trim() !== "") {
        finishProcess(processId, "PROCESSING", "กำลังแปลเนื้อหาย่อ...");
        const excerptRes = await translateTextAction(excerpt, "plain");
        form.setValue("excerpt_en", excerptRes.en, { shouldDirty: true });
        form.setValue("excerpt_cn", excerptRes.cn, { shouldDirty: true });
        form.setValue("excerpt_ru", excerptRes.ru, { shouldDirty: true });
      }

      // 3. Translate Content (HTML)
      if (content && content.trim() !== "" && content !== "<p></p>") {
        finishProcess(processId, "PROCESSING", "กำลังแปลเนื้อหาฉบับเต็ม (HTML)...");
        const contentRes = await translateTextAction(content, "html");
        form.setValue("content_en", contentRes.en, { shouldDirty: true });
        form.setValue("content_cn", contentRes.cn, { shouldDirty: true });
        form.setValue("content_ru", contentRes.ru, { shouldDirty: true });
      }

      finishProcess(processId, "SUCCESS", "แปลเนื้อหาบทความเรียบร้อยแล้ว ✨");
      form.setValue("requires_ai_review", true, { shouldDirty: true });
    } catch (error: unknown) {
      console.error("Translation error:", error);
      const msg = error instanceof Error ? error.message : "การแปลขัดข้อง";
      finishProcess(processId, "ERROR", msg);
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
        // router.push("/protected/blogs"); // ลบออกเพื่อให้ Dialog แสดงค้างไว้
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-20 relative">
        {/* 🤖 BACKGROUND GENERATION LOADING OVERLAY */}
        {isAiGenerating && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-start pt-40 transition-all duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-6 max-w-sm text-center animate-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="absolute -inset-4 bg-violet-500/10 rounded-full blur-2xl animate-pulse" />
                <Loader2 className="h-12 w-12 text-violet-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">กำลังรับข้อมูลจาก AI...</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  AI กำลังรังสรรค์เนื้อหาบทความระดับพรีเมียมให้คุณ <br/>
                  ข้อมูลจะถูกเติมลงในฟอร์มโดยอัตโนมัติเมื่อเสร็จสิ้น
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Background Sync Active</span>
              </div>
            </div>
          </div>
        )}

        {form.watch("requires_ai_review") && (
          <AiReviewBanner
            type="blog"
            onConfirm={() => form.setValue("requires_ai_review", false, { shouldDirty: true })}
            isVerifying={isSubmitting}
          />
        )}
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
              onRegenerateSlug={regenerateSlug}
            />
          </TabsContent>

          <TabsContent value="media">
            <BlogMediaTab form={form} categories={categories} />
          </TabsContent>

          <TabsContent value="seo">
            <BlogSeoTab form={form} postId={initialData?.id} />
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
