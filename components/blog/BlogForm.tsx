"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { FileJson } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { blogPostSchema } from "@/features/blog/schema";
import { BlogPostInput, BlogPostRow } from "@/features/blog/types";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/features/blog/actions";
import { TiptapEditor } from "./TiptapEditor";
import { CategoryDialog } from "./CategoryDialog";

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
    resolver: zodResolver(blogPostSchema),
    defaultValues,
  });

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue("title", title);
    if (!initialData) {
      const slug = title
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      form.setValue("slug", slug);
    }
  };

  const [importJsonOpen, setImportJsonOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);

      if (data.title) form.setValue("title", data.title);
      if (data.slug) form.setValue("slug", data.slug);
      if (data.excerpt) form.setValue("excerpt", data.excerpt);
      if (data.content) form.setValue("content", data.content);
      if (data.category) form.setValue("category", data.category);
      if (data.cover_image) form.setValue("cover_image", data.cover_image);
      if (data.reading_time) form.setValue("reading_time", data.reading_time);
      if (data.tags) form.setValue("tags", data.tags);
      if (typeof data.is_published === "boolean")
        form.setValue("is_published", data.is_published);

      if (data.structured_data) {
        const sd =
          typeof data.structured_data === "object"
            ? JSON.stringify(data.structured_data, null, 2)
            : data.structured_data;
        form.setValue("structured_data", sd);
      }

      toast.success("Data imported successfully");
      setImportJsonOpen(false);
    } catch (e) {
      toast.error("Invalid JSON format");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-between items-center">
          <Dialog open={importJsonOpen} onOpenChange={setImportJsonOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" className="gap-2">
                <FileJson className="h-4 w-4" />
                Import JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import from JSON</DialogTitle>
                <DialogDescription>
                  Paste a JSON object to autofill the form. Existing data will
                  be overwritten.
                </DialogDescription>
              </DialogHeader>
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

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              {initialData ? "Update Post" : "Create Post"}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content (Left, 2 cols) */}
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Article Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Article Title"
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
                      <FormLabel>Slug (URL Friendly)</FormLabel>
                      <FormControl>
                        <Input placeholder="article-title-slug" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the URL (e.g. /blog/my-post)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary for the card preview..."
                          className="h-20 resize-none"
                          {...field}
                        />
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
                      <FormLabel>Content (Rich Text)</FormLabel>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Structured Data (JSON-LD)</CardTitle>
                <FormDescription>
                  Paste JSON schema for SEO here.
                </FormDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="structured_data"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder='{ "@context": "https://schema.org", "@type": "Article", ... }'
                          className="font-mono text-xs min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (Right, 1 col) */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Publish immediately</FormLabel>
                        <FormDescription>
                          Make this post visible on the public site.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

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
                  name="reading_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reading Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5 min read" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Comma separated)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Condo, Investment, 2026"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cover_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Paste a URL from Unsplash or upload to storage and paste
                        link here.
                      </FormDescription>
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
