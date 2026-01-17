"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Pencil, Eye, Globe, EyeOff, Clock } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteBlogsAction } from "@/features/blogs/bulk-actions";
import { toast } from "sonner";
import { DeleteBlogPostButton } from "@/app/(protected)/protected/blogs/_components/DeleteBlogPostButton";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  author: unknown;
  is_published: boolean | null;
  published_at: string | null;
}

interface BlogsTableProps {
  posts: BlogPost[];
}

export function BlogsTable({ posts }: BlogsTableProps) {
  const now = new Date();
  const allIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const {
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
    selectedIds,
  } = useTableSelection(allIds);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteBlogsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      window.location.reload();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="บทความ"
      />

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label="เลือกทั้งหมด"
                  className={
                    isPartialSelected
                      ? "data-[state=checked]:bg-primary/50"
                      : ""
                  }
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium">ยังไม่มีบทความ</p>
                    <p className="text-xs text-slate-400">
                      สร้างบทความแรกของคุณเพื่อเริ่มต้น
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => {
                const isScheduled =
                  post.published_at && new Date(post.published_at) > now;
                const publishedDate = post.published_at
                  ? new Date(post.published_at)
                  : null;

                return (
                  <TableRow
                    key={post.id}
                    className={`hover:bg-slate-50/50 ${
                      isSelected(post.id) ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <TableCell className="w-[50px]">
                      <Checkbox
                        checked={isSelected(post.id)}
                        onCheckedChange={() => toggleSelect(post.id)}
                        aria-label={`เลือก ${post.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="line-clamp-1">{post.title}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          /{post.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.category ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {post.category}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {post.author ? (
                          <span>Admin</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isScheduled ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <Clock className="h-3 w-3" />
                          Scheduled
                        </Badge>
                      ) : post.is_published ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-50 text-green-700 border-green-200"
                        >
                          <Globe className="h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-orange-50 text-orange-700 border-orange-200"
                        >
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {publishedDate ? (
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(publishedDate, "dd MMM yyyy")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(publishedDate, "HH:mm")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="View Public Page"
                        >
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Edit"
                        >
                          <Link href={`/protected/blogs/${post.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteBlogPostButton id={post.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
