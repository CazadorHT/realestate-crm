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
import { TiptapEditor } from "./TiptapEditor";
import { CategoryDialog } from "./CategoryDialog";
import { BlogImageUploader } from "./BlogImageUploader";
import { BlogAiGenerator } from "./BlogAiGenerator";
import { BlogContentRefiner } from "./BlogContentRefiner";

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
        // @ts-ignore
        if (defaultValues[key] !== undefined) {
          // @ts-ignore
          setValue(key, data[key]);
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
        {/* Premium Sticky Header */}
        <div className="sticky top-16 z-50 -mx-6 px-4 md:px-6 mb-6">
          <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 rounded-xl shadow-sm py-4 px-4 md:px-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left - Back & Title */}
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="hover:bg-slate-100 rounded-full shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                    <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">
                      {initialData ? "แก้ไขบทความ" : "สร้างบทความใหม่"}
                    </h1>
                    {watchedIsPublished ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 text-[10px] md:text-xs">
                        <Eye className="h-3 w-3" />
                        <span className="hidden xs:inline">เผยแพร่แล้ว</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[10px] md:text-xs"
                      >
                        <EyeOff className="h-3 w-3" />
                        <span className="hidden xs:inline">แบบร่าง</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] md:text-sm text-slate-500 mt-0.5">
                    {characterCount.toLocaleString()} ตัวอักษร
                  </p>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex md:flex-wrap items-center justify-end gap-2 sm:gap-3">
                <div className="hidden lg:block">
                  <Dialog
                    open={importJsonOpen}
                    onOpenChange={setImportJsonOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex gap-2 h-10 md:h-12"
                      >
                        <FileJson className="h-4 w-4" />
                        <span className="hidden md:inline">นำเข้า JSON</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw]">
                      <DialogHeader>
                        <DialogTitle>นำเข้าข้อมูลจาก JSON</DialogTitle>
                        <DialogDescription>
                          วาง JSON object เพื่อกรอกข้อมูลอัตโนมัติ
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Textarea
                          placeholder='{ "title": "...", "content": "..." }'
                          className="font-mono min-h-[300px]"
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 h">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImportJsonOpen(false)}
                          >
                            ยกเลิก
                          </Button>
                          <Button type="button" onClick={handleImport}>
                            นำเข้า
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* AI Blog Generator */}
                <BlogAiGenerator onGenerated={handleAiGenerated} />

                {/* AI Content Refiner */}
                <div className="hidden lg:block">
                  <BlogContentRefiner
                    currentContent={form.watch("content") || ""}
                    onRefined={(newContent) =>
                      form.setValue("content", newContent, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                {/* Publish Toggle */}
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 h-10 md:h-12 overflow-hidden">
                      <span className="text-[10px] md:text-sm font-medium text-slate-600">
                        เผยแพร่
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          toast.success(
                            checked
                              ? "เปิดเผยแพร่บทความสำเร็จ"
                              : "ปิดการเผยแพร่บทความสำเร็จ",
                          );
                        }}
                        className="data-[state=checked]:bg-blue-600 scale-75 md:scale-90"
                      />
                    </div>
                  )}
                />

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !watchedTitle?.trim() ||
                    characterCount === 0 ||
                    !form.formState.isDirty
                  }
                  className="gap-2 bg-linear-to-r h-10 md:h-12 from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        </div>

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

          {/* Tab 1: Content */}
          <TabsContent value="content" className="space-y-6">
            {/* Title & Slug Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Type className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    ข้อมูลพื้นฐาน
                  </h3>
                  <p className="text-sm text-slate-500">
                    หัวข้อและ URL ของบทความ
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-700 font-medium">
                        หัวข้อบทความ (ไทย){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleTranslateBlog}
                        disabled={isTranslating}
                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 transition-all text-xs"
                      >
                        {isTranslating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        AI แปลทุกส่วนเป็น EN/CN
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="เขียนหัวข้อที่น่าสนใจ..."
                        className="text-lg font-medium h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTitleChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="title_en"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Languages className="w-3 h-3" /> Title (English)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                          placeholder="English title..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title_cn"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium text-[10px] md:text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Languages className="w-3 h-3" /> 文章标题 (Chinese)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                          placeholder="中文标题..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      URL Slug
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                          /blog/
                        </span>
                        <Input
                          {...field}
                          className="rounded-l-none font-mono text-sm border-slate-200"
                          placeholder="post-url-slug"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-slate-500">
                      URL จะถูกสร้างอัตโนมัติจากหัวข้อ
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    เนื้อหาบทความ
                  </h3>
                  <p className="text-sm text-slate-500">
                    เขียนเนื้อหาด้วย Rich Text Editor
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TiptapEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-4 h-4" /> Content (English)
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="content_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TiptapEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Languages className="w-4 h-4" /> 文章内容 (Chinese)
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="content_cn"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TiptapEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Media & Categories */}
          <TabsContent value="media" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Featured Image */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      รูปภาพหน้าปก
                    </h3>
                    <p className="text-sm text-slate-500">
                      รูปภาพหลักของบทความ
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="cover_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <BlogImageUploader
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category & Tags */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Tag className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      หมวดหมู่และแท็ก
                    </h3>
                    <p className="text-sm text-slate-500">
                      จัดระเบียบบทความของคุณ
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          หมวดหมู่
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 border-slate-200">
                              <SelectValue placeholder="เลือกหมวดหมู่" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            {categories.map(
                              (cat) =>
                                cat.name !== "General" && (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ),
                            )}
                          </SelectContent>
                        </Select>
                        <div className="pt-2">
                          <CategoryDialog categories={categories} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          แท็ก
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ข่าว, เคล็ดลับ, 2024 (คั่นด้วยเครื่องหมายจุลภาค)"
                            className="h-11 border-slate-200"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          ใส่แท็กคั่นด้วยเครื่องหมายจุลภาค (,)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Schedule */}
                  <FormField
                    control={form.control}
                    name="published_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">
                          กำหนดการเผยแพร่
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-11 pl-3 text-left font-normal border-slate-200",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP", {
                                    locale: th,
                                  })
                                ) : (
                                  <span>เลือกวันที่</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(date?.toISOString())
                              }
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-slate-500">
                          หากเลือกวันในอนาคต บทความจะถูกตั้งเวลาเผยแพร่
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: SEO */}
          <TabsContent value="seo" className="space-y-6">
            {/* Google Preview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    ตัวอย่างบน Google
                  </h3>
                  <p className="text-sm text-slate-500">
                    ดูว่าบทความจะแสดงอย่างไรในผลการค้นหา
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <div className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer truncate font-medium">
                    {watchedTitle || "หัวข้อบทความ"}
                  </div>
                  <div className="text-sm text-[#006621] truncate">
                    https://yoursite.com/blog/{watchedSlug || "slug"}
                  </div>
                  <div className="text-sm text-[#545454] line-clamp-2">
                    {watchedExcerpt ||
                      "กรุณาใส่ข้อความสรุปเพื่อดูตัวอย่างการแสดงผลบน Google"}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Description */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Search className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Meta Description
                  </h3>
                  <p className="text-sm text-slate-500">
                    ข้อความสรุปสำหรับ SEO
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">
                      ข้อความสรุป (ไทย)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="สรุปเนื้อหาบทความสั้นๆ (แนะนำ 150-160 ตัวอักษร)"
                        className="min-h-[100px] resize-none border-slate-200"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between">
                      <FormMessage />
                      <span
                        className={cn(
                          "text-xs",
                          (field.value?.length || 0) > 160
                            ? "text-red-500"
                            : "text-slate-500",
                        )}
                      >
                        {field.value?.length || 0}/160
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="excerpt_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Languages className="w-3 h-3" /> Excerpt (English)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          className="min-h-[80px] resize-none border-slate-200 text-sm"
                          placeholder="English excerpt..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="excerpt_cn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Languages className="w-3 h-3" /> 文章摘要 (Chinese)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          className="min-h-[80px] resize-none border-slate-200 text-sm"
                          placeholder="中文摘要..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Structured Data */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Structured Data (JSON-LD)
                    </h3>
                    <p className="text-sm text-slate-500">
                      ข้อมูล Schema.org สำหรับ SEO
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateJsonLd}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  สร้างอัตโนมัติ
                </Button>
              </div>

              <FormField
                control={form.control}
                name="structured_data"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder='{ "@context": "https://schema.org", ... }'
                        className="font-mono text-xs min-h-[200px] border-slate-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-max md:min-w-[600px]  lg:min-w-6xl max-w-6xl px-4">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl py-3 md:py-4 px-6 md:px-10 flex items-center justify-center lg:justify-between gap-6">
            <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500">
              <span className="hidden md:inline">
                {watchedIsPublished
                  ? "บทความนี้ถูกเผยแพร่แล้ว"
                  : "บทความนี้ยังเป็นแบบร่าง"}
              </span>
              <div className="h-4 w-px bg-slate-200 hidden md:block" />
              <span>
                {(watchedContent || "")
                  .replace(/<[^>]*>?/gm, "")
                  .length.toLocaleString()}{" "}
                ตัวอักษร
              </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 justify-center lg:justify-end">
              {/* Publication Switch - duplicate of top for convenience */}
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 h-10 md:h-12 overflow-hidden">
                    <span className="text-[10px] md:text-sm font-medium text-slate-600">
                      เผยแพร่
                    </span>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        toast.success(
                          checked
                            ? "เปิดเผยแพร่บทความสำเร็จ"
                            : "ปิดการเผยแพร่บทความสำเร็จ",
                        );
                      }}
                      className="h-5 w-9 data-[state=checked]:bg-blue-600 scale-75 md:scale-90"
                    />
                  </div>
                )}
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="hover:bg-slate-100 h-10 md:h-12 px-2 md:px-4 text-xs md:text-sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !watchedTitle?.trim() ||
                    characterCount === 0 ||
                    !form.formState.isDirty
                  }
                  className="gap-2 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-green-500/25 min-w-[80px] md:min-w-[120px] h-10 md:h-12 text-xs md:text-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Navigation Dialog */}
        <Dialog
          open={!!successData}
          onOpenChange={(open) => {
            if (!open) {
              router.push("/protected/blogs");
            }
          }}
        >
          <DialogContent className="sm:max-w-md bg-white border-0 shadow-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-emerald-600 text-xl">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <ExternalLink className="w-6 h-6" />
                </div>
                บันทึกบทความสำเร็จ
              </DialogTitle>
              <DialogDescription className="text-base text-slate-600 pt-2">
                คุณต้องการทำรายการใดต่อ?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 text-base font-medium border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
                onClick={() => {
                  if (successData?.slug) {
                    window.open(`/blog/${successData.slug}`, "_blank");
                    router.push("/protected/blogs");
                  } else {
                    toast.error("ไม่พบข้อมูล Slug สำหรับเปิดหน้าเว็บ");
                  }
                }}
              >
                <ExternalLink className="w-5 h-5 text-blue-600" />
                <div className="flex flex-col items-start">
                  <span>ดูหน้าบทความ (Blog Page)</span>
                  <span className="text-xs text-slate-400 font-normal">
                    เปิดแท็บใหม่เพื่อดูตัวอย่าง
                  </span>
                </div>
              </Button>

              <Button
                className="w-full justify-start gap-3 h-14 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                onClick={() => router.push("/protected/blogs")}
              >
                <List className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span>กลับหน้ารายการบทความ </span>
                  <span className="text-xs text-slate-400/80 font-normal">
                    จัดการบทความอื่นต่อ
                  </span>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}
