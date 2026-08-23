"use client";
import { useState, useMemo, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Instagram, Images, X, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export interface InstagramPost {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  media_type?: string;
  timestamp?: string;
}

interface PostPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPostId?: string;
  onSelect: (post: InstagramPost) => void;
}

export function PostPickerDialog({
  open,
  onOpenChange,
  selectedPostId,
  onSelect,
}: PostPickerDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM">("ALL");

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/instagram-posts");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPosts(data.posts || []);
        setHasFetched(true);
      }
    } catch {
      setError(isEn ? "Error fetching posts. Please retry." : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically fetch posts when dialog is opened
  useEffect(() => {
    if (open && !hasFetched && !isLoading) {
      fetchPosts();
    }
  }, [open, hasFetched, isLoading]);

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = !search || post.caption?.toLowerCase().includes(search.toLowerCase()) || post.id.includes(search);
      const matchesType = filterType === "ALL" || post.media_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [posts, search, filterType]);

  const filterLabels: Record<string, string> = {
    ALL: isEn ? "All" : "ทั้งหมด",
    IMAGE: isEn ? "Photos" : "รูปภาพ",
    VIDEO: isEn ? "Videos" : "วิดีโอ",
    CAROUSEL_ALBUM: isEn ? "Carousels" : "อัลบั้ม",
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600 rounded-xl shadow-lg shadow-violet-200">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold">
            {isEn ? "Select Linked Post for Keyword" : "เลือกโพสต์ที่ต้องการผูก Keyword"}
          </span>
        </div>
      }
      description={isEn ? "Auto-reply will only trigger for comments on the selected post" : "Keyword นี้จะตอบกลับเฉพาะ Comment ที่เข้ามาในโพสต์ที่คุณเลือก"}
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-xs text-slate-400">
            {posts.length > 0 && (isEn ? `${filteredPosts.length} / ${posts.length} Posts` : `${filteredPosts.length} / ${posts.length} โพสต์`)}
          </span>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl font-semibold"
          >
            {isEn ? "Close" : "ปิด"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isEn ? "Search caption or Post ID..." : "ค้นหาจาก caption หรือ Post ID..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPosts}
            disabled={isLoading}
            className="h-10 rounded-xl gap-1.5 px-4 shrink-0"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {isEn ? "Reload" : "โหลดใหม่"}
          </Button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "IMAGE", "VIDEO", "CAROUSEL_ALBUM"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                filterType === type
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                  : "text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600"
              }`}
            >
              {filterLabels[type]}
              {type !== "ALL" && posts.filter((p) => p.media_type === type).length > 0 && (
                <span className="ml-1 opacity-70">
                  ({posts.filter((p) => p.media_type === type).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">
              {isEn ? "Loading posts..." : "กำลังโหลดโพสต์..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="p-4 bg-red-50 rounded-2xl">
              <Instagram className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPosts} className="rounded-xl mt-1">
              {isEn ? "Retry" : "ลองใหม่"}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && hasFetched && filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Images className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400 font-medium">
              {search || filterType !== "ALL" 
                ? (isEn ? "No matching posts found" : "ไม่พบโพสต์ที่ตรงกับเงื่อนไข") 
                : (isEn ? "No posts found" : "ไม่พบโพสต์")}
            </p>
          </div>
        )}

        {/* Posts Grid */}
        {!isLoading && filteredPosts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredPosts.map((post) => {
              const isSelected = selectedPostId === post.id;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => {
                    onSelect(post);
                    onOpenChange(false);
                  }}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.02] group text-left ${
                    isSelected
                      ? "border-violet-500 shadow-lg shadow-violet-200/60 ring-2 ring-violet-200"
                      : "border-slate-200 hover:border-violet-300 hover:shadow-md"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-slate-100 relative">
                    {post.thumbnail_url || post.media_url ? (
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt={post.caption || "post"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Instagram className="h-8 w-8 text-slate-300" />
                      </div>
                    )}

                    {/* Video play icon */}
                    {post.media_type === "VIDEO" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[11px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Carousel icon */}
                    {post.media_type === "CAROUSEL_ALBUM" && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center">
                          <Images className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className={`p-2.5 border-t ${isSelected ? "bg-violet-50 border-violet-100" : "bg-white border-slate-100"}`}>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium min-h-[30px]">
                      {post.caption || <span className="text-slate-300 italic">{isEn ? "No caption" : "ไม่มี Caption"}</span>}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 gap-1">
                      <Badge
                        className={`text-[9px] px-1.5 py-0 rounded-full font-bold uppercase ${
                          post.media_type === "VIDEO"
                            ? "bg-blue-100 text-blue-600"
                            : post.media_type === "CAROUSEL_ALBUM"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {post.media_type === "CAROUSEL_ALBUM" 
                          ? (isEn ? "Album" : "อัลบั้ม") 
                          : post.media_type === "VIDEO" 
                          ? (isEn ? "Video" : "วิดีโอ") 
                          : (isEn ? "Photo" : "รูป")}
                      </Badge>
                      {post.timestamp && (
                        <span className="text-[9px] text-slate-400">
                          {new Date(post.timestamp).toLocaleDateString(isEn ? "en-US" : "th-TH", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}

