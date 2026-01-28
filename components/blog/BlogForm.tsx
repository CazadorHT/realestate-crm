"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Save,
  FileJson,
  Calendar as CalendarIcon,
  Clock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { blogPostSchema } from "@/features/blog/schema";
import { BlogPostInput, BlogPostRow } from "@/features/blog/types";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/features/blog/actions";
import { TiptapEditor } from "./TiptapEditor";
import { CategoryDialog } from "./CategoryDialog";
import { BlogImageUploader } from "./BlogImageUploader";

interface BlogFormProps {
  initialData?: BlogPostRow;
  categories?: { id: string; name: string }[];
}

export function BlogForm({ initialData, categories = [] }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        reading_time: initialData.reading_time || "5 min read",
        tags: Array.isArray(initialData.tags)
          ? initialData.tags.join(", ")
          : "",
        is_published: initialData.is_published || false,
        structured_data: initialStructuredData,
        published_at: initialData.published_at || undefined,
      }
    : {
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: "General",
        cover_image: "",
        reading_time: "5 min read",
        tags: "",
        is_published: false,
        structured_data: "",
      };

  const form = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema) as unknown as Resolver<any>,
    defaultValues,
  });

  const { watch, setValue } = form;
  const watchedTitle = watch("title");
  const watchedContent = watch("content");
  const watchedExcerpt = watch("excerpt");
  const watchedSlug = watch("slug");
  const watchedIsPublished = watch("is_published");

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

  // Auto-calculate reading time
  useEffect(() => {
    if (watchedContent) {
      const text = watchedContent.replace(/<[^>]*>?/gm, ""); // Strip HTML
      const wordCount = text.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute
      setValue("reading_time", `${readingTime} min read`);
    }
  }, [watchedContent, setValue]);

  const [importJsonOpen, setImportJsonOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      // ... (Same import logic as before)
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

      toast.success("Data imported successfully");
      setImportJsonOpen(false);
    } catch (e) {
      toast.error("Invalid JSON format");
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
        name: "Admin", // Or current user name
      },
    };
    setValue("structured_data", JSON.stringify(jsonLd, null, 2));
    toast.success("JSON-LD Generated");
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
        router.push("/protected/blogs");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b py-4 -mx-6 px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground"
            >
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold leading-none">
                {initialData ? "Edit Article" : "Create New Article"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {watchedIsPublished ? (
                  <Badge
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
                <span>•</span>
                {watch("reading_time")}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={importJsonOpen} onOpenChange={setImportJsonOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import from JSON</DialogTitle>
                  <DialogDescription>
                    Paste JSON object to autofill.
                  </DialogDescription>
                </DialogHeader>
                {/* ... Import content ... */}
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder='{ "title": "...", "content": "..." }'
                    className="font-mono min-h-[300px]"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setImportJsonOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleImport}>
                      Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_350px]">
          {/* Main Content (Left) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Write your masterpiece.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a catchy title..."
                          className="text-lg font-medium"
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

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                            /blog/
                          </span>
                          <Input
                            {...field}
                            className="rounded-l-none font-mono text-sm"
                            placeholder="post-url-slug"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <div className="flex justify-end items-center text-xs text-muted-foreground gap-4">
                        <span>
                          {watchedContent
                            ? watchedContent.replace(/<[^>]*>?/gm, "").length
                            : 0}{" "}
                          characters
                        </span>
                        <span>{watch("reading_time")}</span>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO & Metadata</CardTitle>
                <CardDescription>Optimize for search engines.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Google Search Preview
                  </div>
                  <div className="space-y-1">
                    <div className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer truncate font-medium">
                      {watchedTitle || "Article Title"}
                    </div>
                    <div className="text-sm text-[#006621] truncate">
                      https://yoursite.com/blog/{watchedSlug || "slug"}
                    </div>
                    <div className="text-sm text-[#545454] line-clamp-2">
                      {watchedExcerpt ||
                        "Please enter an excerpt to see how it looks on Google search results."}
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt / Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary (150-160 chars recommended)"
                          className="h-24 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <FormLabel>Structured Data (JSON-LD)</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateJsonLd}
                      className="h-7 text-xs"
                    >
                      Generate Default
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="structured_data"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder='{ "@context": "..." }'
                            className="font-mono text-xs min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published</FormLabel>
                        <FormDescription>Visible to public?</FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="published_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Schedule Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
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
                      <FormDescription>
                        If set in future, post is scheduled.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="General">General</SelectItem>
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
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="News, Tips, 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
