"use client";
import { useMemo, useTransition, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Eye,
  Pencil,
  Globe,
  EyeOff,
  Clock,
  MoreVertical,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteBlogsAction } from "@/features/blog/bulk-actions";
import { toast } from "sonner";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DeleteBlogPostButton } from "@/app/(protected)/protected/blogs/_components/DeleteBlogPostButton";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import {
  bulkUpdateBlogStatusAction,
  deleteBlogPostAction,
  restoreBlogPostAction,
  permanentDeleteBlogPostAction,
  bulkRestoreBlogAction,
} from "@/features/blog/actions";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { BlogPost } from "@/lib/services/blog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BlogsTableProps {
  posts: BlogPost[];
  totalCount: number;
  currentPage: number;
}

/**
 * Premium Loading Skeleton for Blogs Table
 */
function BlogsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="hidden lg:block rounded-xl border border-slate-200 bg-white">
        <div className="h-12 bg-slate-50 border-b border-slate-200" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex h-20 items-center gap-4 px-4 border-b border-slate-100 last:border-0"
          >
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-12 w-20 rounded-lg aspect-video" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>
      <div className="lg:hidden space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200 space-y-4"
          >
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mobile Action Drawer Component
 */
function MobileActionDrawer({
  post,
  isTrash,
}: {
  post: BlogPost;
  isTrash?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const handleAction = async (action: () => Promise<any>) => {
    setIsBusy(true);
    const res = await action();
    if (res.success) {
      toast.success(res.message);
      setOpen(false);
    } else {
      toast.error(res.message);
    }
    setIsBusy(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isTrash ? "จัดการถังขยะ" : "จัดการบทความ"}
      trigger={
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
          <MoreVertical className="h-5 w-5" />
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 p-6">
        {isTrash ? (
          <>
            <ConfirmDialog
              title="กู้คืนบทความ"
              description={`คุณต้องการกู้คืนบทความ "${post.title}" กลับมาใช้งานปกติใช่หรือไม่?`}
              confirmText="กู้คืนบทความ"
              onConfirm={() =>
                handleAction(() => restoreBlogPostAction(post.id))
              }
              trigger={
                <Button
                  variant="outline"
                  className="h-12 rounded-xl justify-start font-bold gap-3 border-slate-200 text-green-600"
                  disabled={isBusy}
                >
                  <RotateCcw className="h-5 w-5" />
                  กู้คืนบทความ
                </Button>
              }
            />
            <ConfirmDialog
              title="ลบบทความถาวร"
              description={`คำเตือน: คุณกำลังจะลบบทความ "${post.title}" ทิ้งถาวร ข้อมูลนี้ไม่สามารถกู้คืนได้อีก`}
              confirmText="ลบถาวรทันที"
              confirmString="DELETE"
              variant="destructive"
              onConfirm={() =>
                handleAction(() => permanentDeleteBlogPostAction(post.id))
              }
              trigger={
                <Button
                  variant="outline"
                  className="h-12 rounded-xl justify-start font-bold gap-3 border-slate-200 text-destructive"
                  disabled={isBusy}
                >
                  <ShieldAlert className="h-5 w-5" />
                  ลบถาวร
                </Button>
              }
            />
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="h-12 rounded-xl justify-start font-bold gap-3 border-slate-200"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href={`/blog/${post.slug}`} target="_blank">
                <Eye className="h-5 w-5 text-blue-500" />
                เปิดดูหน้าเว็บ
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl justify-start font-bold gap-3 border-slate-200 text-slate-600 relative overflow-hidden"
              onClick={() => {
                setIsBusy(true);
                router.push(`/protected/blogs/${post.id}`);
              }}
              disabled={isBusy}
            >
              {isBusy ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              ) : (
                <Pencil className="h-5 w-5 text-amber-500" />
              )}
              แก้ไขเนื้อหา
            </Button>
            <div className="col-span-2 pt-2 border-t border-slate-100">
              <DeleteBlogPostButton
                id={post.id}
                variant="full"
                onSuccess={() => setOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    </ResponsiveDialog>
  );
}

export function BlogsTable({
  posts,
  totalCount,
  currentPage,
}: BlogsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "active";
  const isTrash = tab === "trash";

  const [isPending, startTransition] = useTransition();
  const now = new Date();
  const allIds = useMemo(() => posts.map((p) => p.id), [posts]);

  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
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

  const handleSuccessFeedback = () => {
    router.refresh();
  };

  const setTab = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    params.set("page", "1"); // Reset to page 1
    router.push(`?${params.toString()}`);
  };

  const handleBulkDelete = (): Promise<void> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        
        if (isTrash) {
            // 🛡️ PERMANENT DELETE (Bulk)
            const { bulkPermanentDeleteBlogAction } = await import("@/features/blog/actions");
            const result = await bulkPermanentDeleteBlogAction(ids);
            if (result.success) {
              toast.success(result.message);
              clearSelection();
              handleSuccessFeedback();
            } else {
              toast.error(result.message);
            }
        } else {
            // 🗑️ SOFT DELETE (Bulk)
            let successCount = 0;
            for (const id of ids) {
              const result = await deleteBlogPostAction(id);
              if (result.success) successCount++;
            }
            if (successCount > 0) {
              toast.success(`ย้าย ${successCount} บทความลงถังขยะเรียบร้อยแล้ว`);
              clearSelection();
              handleSuccessFeedback();
            }
        }
        resolve();
      });
    });
  };

  const handleBulkStatusUpdate = async (isPublished: boolean) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkUpdateBlogStatusAction(ids, isPublished);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
          handleSuccessFeedback();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาด");
        }
        resolve();
      });
    });
  };

  const handleBulkRestore = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkRestoreBlogAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
          handleSuccessFeedback();
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาด");
        }
        resolve();
      });
    });
  };

  // 🚩 ALWAYS RENDER TABS AT THE TOP
  const TabHeader = (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-1 mb-4">
      <Button
        variant="ghost"
        onClick={() => setTab("active")}
        className={cn(
          "h-10 rounded-none border-b-2 px-6 font-bold transition-all",
          !isTrash
            ? "border-blue-600 text-blue-600 bg-blue-50/50"
            : "border-transparent text-slate-400 hover:text-slate-600",
        )}
      >
        บทความทั้งหมด
      </Button>
      <Button
        variant="ghost"
        onClick={() => setTab("trash")}
        className={cn(
          "h-10 rounded-none border-b-2 px-6 font-bold transition-all",
          isTrash
            ? "border-red-600 text-red-600 bg-red-50/50"
            : "border-transparent text-slate-400 hover:text-slate-600",
        )}
      >
        ถังขยะ
        {isTrash && posts.length > 0 && (
          <Badge className="ml-2 bg-red-100 text-red-600 hover:bg-red-100 border-none px-1.5 h-4 text-[10px]">
            {posts.length}
          </Badge>
        )}
      </Button>
    </div>
  );

  // World-class Empty State
  if (posts.length === 0 && !isPending) {
    return (
      <div className="space-y-4">
        {TabHeader}
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[400px] text-center animate-in fade-in zoom-in duration-500">
          <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-2">
            {isTrash ? "ถังขยะว่างเปล่า" : "ยังไม่มีบทความในระบบ"}
          </h3>
          <p className="text-slate-500 max-w-sm mb-8 font-medium">
            {isTrash 
              ? "ไม่มีบทความที่ถูกลบค้างอยู่ในถังขยะ" 
              : "เริ่มสร้างเนื้อหาแรกของคุณ เพื่อดึงดูดผู้ใช้งานและเพิ่มประสิทธิภาพด้าน SEO ให้กับเว็บไซต์"}
          </p>
          {!isTrash && (
            <Button
              className="rounded-xl h-11 px-8 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
              onClick={() => {
                setNavigatingId("new-blog");
                router.push("/protected/blogs/new");
              }}
              disabled={navigatingId === "new-blog"}
            >
              {navigatingId === "new-blog" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "สร้างบทความแรกของคุณ"
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {TabHeader}

      <ConfirmDialog
        open={isBulkDeleteConfirmOpen}
        onOpenChange={setIsBulkDeleteConfirmOpen}
        title={isTrash ? "ยืนยันลบถาวรแบบกลุ่ม" : "ยืนยันย้ายลงถังขยะแบบกลุ่ม"}
        description={
          isTrash
            ? `คำเตือน: คุณกำลังจะลบ ${selectedCount} บทความทิ้งถาวร ข้อมูลนี้ไม่สามารถกู้คืนได้อีก`
            : `คุณกำลังจะย้าย ${selectedCount} บทความไปที่ถังขยะ (คุณสามารถกู้คืนได้ภายหลังหน้าถังขยะ)`
        }
        confirmText={isTrash ? "ลบถาวรทั้งหมด" : "ย้ายลงถังขยะ"}
        confirmString={isTrash ? "DELETE" : undefined}
        variant={isTrash ? "destructive" : "default"}
        onConfirm={handleBulkDelete}
      />

      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={async () => setIsBulkDeleteConfirmOpen(true)}
        entityName="บทความ"
        onDeleteLabel={isTrash ? "ลบถาวร" : "ย้ายลงถังขยะ"}
        className={cn(isPending && "opacity-50 pointer-events-none")}
        extraActions={
          isTrash ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              className="h-8 rounded-lg border-slate-200 text-xs font-bold gap-1.5 bg-white hover:bg-slate-50 text-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5 text-green-600" />
              กู้คืนข้อมูล
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate(true)}
                className="h-8 rounded-lg border-slate-200 text-xs font-bold gap-1.5"
              >
                <Globe className="h-3.5 w-3.5 text-green-500" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate(false)}
                className="h-8 rounded-lg border-slate-200 text-xs font-bold gap-1.5"
              >
                <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                Draft
              </Button>
            </div>
          )
        }
      />

      {isPending && <BlogsTableSkeleton />}

      {!isPending && (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] pl-6">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={() => toggleSelectAll(allIds)}
                      className={cn(
                        "rounded-md border-slate-300",
                        isPartialSelected &&
                          "data-[state=checked]:bg-blue-500/50",
                      )}
                    />
                  </TableHead>
                  <TableHead className="w-[120px] font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    รูปตัวอย่าง
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    รายละเอียดบทความ
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    หมวดหมู่
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    ผู้เขียน
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    {isTrash ? "วันที่ลบ" : "สถานะ"}
                  </TableHead>
                  <TableHead className="text-right pr-6 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    จัดการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const isScheduled =
                    post.published_at && new Date(post.published_at) > now;
                  const publishedDate = post.published_at
                    ? new Date(post.published_at)
                    : null;
                  const selected = isSelected(post.id);

                  return (
                    <TableRow
                      key={post.id}
                      className={cn(
                        "group transition-colors duration-200",
                        selected ? "bg-blue-50/40" : "hover:bg-slate-50/50",
                      )}
                    >
                      <TableCell className="pl-6">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleSelect(post.id)}
                          className="rounded-md border-slate-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative aspect-video w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100/50 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                          {post.cover_image ? (
                            <Image
                              src={post.cover_image}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="100px"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-linear-to-br from-slate-50 to-slate-200 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="flex flex-col gap-0.5">
                          <div
                            onClick={() => {
                              setNavigatingId(post.id);
                              router.push(`/protected/blogs/${post.id}`);
                            }}
                            className="cursor-pointer relative"
                          >
                            {navigatingId === post.id && (
                              <Loader2 className="h-3 w-3 animate-spin text-blue-600 absolute -left-4 top-1" />
                            )}
                            <span className="font-bold line-clamp-1 text-slate-900 group-hover:text-blue-600 transition-colors">
                              {post.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 tracking-tight truncate">
                            /{post.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.category ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50/50 text-blue-700 border-blue-100 rounded-lg px-2.5 py-0.5 font-bold text-[10px]"
                          >
                            {post.category}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 italic text-xs">
                            ไม่มีหมวดหมู่
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden border border-slate-200">
                            {post.profiles?.avatar_url ? (
                              <Image
                                src={post.profiles.avatar_url}
                                alt={post.profiles.full_name || "Author"}
                                width={24}
                                height={24}
                                className="object-cover"
                              />
                            ) : (
                              (
                                post.profiles?.full_name?.charAt(0) || "A"
                              ).toUpperCase()
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-600 truncate max-w-[100px]">
                            {post.profiles?.full_name || "Admin"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isTrash ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-red-600">
                              ลบเมื่อวันที่
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {post.deleted_at
                                ? format(
                                    new Date(post.deleted_at),
                                    "dd MMM yyyy",
                                    { locale: th },
                                  )
                                : "-"}
                            </span>
                          </div>
                        ) : isScheduled ? (
                          <Badge
                            variant="outline"
                            className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 font-bold px-2 rounded-full text-[10px]"
                          >
                            <Clock className="h-3 w-3" /> ตั้งเวลาเผยแพร่
                          </Badge>
                        ) : post.is_published ? (
                          <Badge
                            variant="outline"
                            className="gap-1.5 bg-green-50 text-green-700 border-green-200 font-bold px-2 rounded-full text-[10px]"
                          >
                            <Globe className="h-3.5 w-3.5" /> เผยแพร่แล้ว
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1.5 bg-orange-50 text-orange-700 border-orange-200 font-bold px-2 rounded-full text-[10px]"
                          >
                            <EyeOff className="h-3.5 w-3.5" /> แบบร่าง
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-10 sm:group-hover:opacity-100 transition-opacity duration-300">
                          {isTrash ? (
                            <>
                              <ConfirmDialog
                                title="กู้คืนบทความ"
                                description={`คุณต้องการกู้คืนบทความ "${post.title}" ใช่หรือไม่?`}
                                confirmText="กู้คืนบทความ"
                                onConfirm={() =>
                                  startTransition(async () => {
                                    const res = await restoreBlogPostAction(
                                      post.id,
                                    );
                                    if (res.success) {
                                      toast.success(res.message);
                                      router.refresh();
                                    }
                                  })
                                }
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-lg"
                                    title="Restore"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <ConfirmDialog
                                title="ลบบทความถาวร"
                                description={`คุณกำลังจะลบบทความ "${post.title}" ทิ้งถาวร การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
                                confirmText="ลบถาวรทันที"
                                confirmString="DELETE"
                                variant="destructive"
                                onConfirm={() =>
                                  startTransition(async () => {
                                    const res =
                                      await permanentDeleteBlogPostAction(
                                        post.id,
                                      );
                                    if (res.success) {
                                      toast.success(res.message);
                                      router.refresh();
                                    }
                                  })
                                }
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                    title="Delete Permanently"
                                  >
                                    <ShieldAlert className="h-4 w-4" />
                                  </Button>
                                }
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Public Preview"
                                onClick={() => {
                                  setNavigatingId(`preview-${post.id}`);
                                  window.open(`/blog/${post.slug}`, "_blank");
                                  setNavigatingId(null);
                                }}
                                disabled={navigatingId === `preview-${post.id}`}
                              >
                                {navigatingId === `preview-${post.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Edit Content"
                                onClick={() => {
                                  setNavigatingId(`edit-${post.id}`);
                                  router.push(`/protected/blogs/${post.id}`);
                                }}
                                disabled={navigatingId === `edit-${post.id}`}
                              >
                                {navigatingId === `edit-${post.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                ) : (
                                  <Pencil className="h-4 w-4" />
                                )}
                              </Button>
                              <DeleteBlogPostButton id={post.id} />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {posts.map((post) => {
              const isScheduled =
                post.published_at && new Date(post.published_at) > now;
              const publishedDate = post.published_at
                ? new Date(post.published_at)
                : null;
              const selected = isSelected(post.id);

              return (
                <div
                  key={post.id}
                  className={cn(
                    "relative group rounded-2xl border bg-white p-4 transition-all duration-300 shadow-sm overflow-hidden",
                    selected
                      ? "ring-2 ring-blue-500 border-transparent"
                      : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  {/* Actions - Absolute Top Far Right */}
                  <div className="absolute top-2 right-2">
                    <MobileActionDrawer post={post} isTrash={isTrash} />
                  </div>

                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative aspect-square h-20 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-sm">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="100px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
                          <ImageIcon className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-start gap-2 mb-1">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleSelect(post.id)}
                          className="mt-1 rounded-md border-slate-300 shadow-none"
                        />
                        <div
                          onClick={() => {
                            setNavigatingId(`m-${post.id}`);
                            router.push(`/protected/blogs/${post.id}`);
                          }}
                          className="block cursor-pointer relative"
                        >
                          {navigatingId === `m-${post.id}` && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute -left-6 top-0.5" />
                          )}
                          <h4 className="font-extrabold text-slate-900 line-clamp-2 leading-tight">
                            {post.title}
                          </h4>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Status Badge - Now in Flow */}
                        {isScheduled ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] h-5 px-1.5 font-bold rounded-full shadow-none">
                            ตั้งเวลา
                          </Badge>
                        ) : post.is_published ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] h-5 px-1.5 font-bold rounded-full shadow-none tracking-tight">
                            เผยแพร่แล้ว
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-50 text-orange-700 border-orange-100 text-[9px] h-5 px-1.5 font-bold rounded-full shadow-none ml-1">
                            แบบร่าง
                          </Badge>
                        )}

                        {post.category && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-slate-50 text-slate-500 border-slate-200 px-1.5 h-5 font-bold uppercase tracking-wider"
                          >
                            {post.category}
                          </Badge>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          /{post.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-[11px] font-bold">
                        {publishedDate
                          ? format(publishedDate, "dd MMM yyyy", { locale: th })
                          : "ยังไม่ได้กำหนด"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden border border-slate-100">
                        {post.profiles?.avatar_url ? (
                          <Image
                            src={post.profiles.avatar_url}
                            alt={post.profiles.full_name || "Author"}
                            width={20}
                            height={20}
                            className="object-cover"
                          />
                        ) : (
                          (
                            post.profiles?.full_name?.charAt(0) || "A"
                          ).toUpperCase()
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {post.profiles?.full_name || "Admin"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Standardized Pagination Controls */}
      <div className="pt-2">
        <PaginationControls
          totalCount={totalCount}
          pageSize={10}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}
