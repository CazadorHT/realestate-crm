"use client";

import { BookOpen } from "lucide-react";

interface BlogSidebarProps {
  posts: any[];
}

export function BlogSidebar({ posts }: BlogSidebarProps) {
  return (
    <aside className="lg:col-span-4 lg:col-start-9">
      <div className="sticky top-24 space-y-6">
        {/* Categories */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-1 bg-linear-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-900">หมวดหมู่</h3>
          </div>
          <div className="space-y-2">
            {(() => {
              // Get unique categories with counts
              const categoryMap = new Map<string, number>();
              posts.forEach((post) => {
                if (post.category) {
                  categoryMap.set(
                    post.category,
                    (categoryMap.get(post.category) || 0) + 1,
                  );
                }
              });
              const categories = Array.from(categoryMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);

              if (categories.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    ยังไม่มีหมวดหมู่
                  </div>
                );
              }

              return categories.map(([cat, count]) => (
                <button
                  key={cat}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 text-slate-700 hover:text-blue-700 font-medium transition-all duration-300 border border-transparent hover:border-blue-200 flex items-center justify-between group"
                >
                  <span>{cat}</span>
                  <span className="text-xs bg-slate-200 group-hover:bg-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded-full transition-colors">
                    {count}
                  </span>
                </button>
              ));
            })()}
          </div>
        </div>

        {/* Tags Cloud */}
        <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-1 bg-linear-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-900">ป้ายยอดนิยม</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // Get all tags from posts
              const allTags = posts.flatMap((post) => post.tags || []);
              const uniqueTags = Array.from(new Set(allTags)).slice(0, 12);

              if (uniqueTags.length === 0) {
                return (
                  <div className="text-center w-full py-4 text-slate-400 text-sm">
                    ยังไม่มีแท็ก
                  </div>
                );
              }

              return uniqueTags.map((tag, idx) => (
                <button
                  key={idx}
                  className="px-3 py-1.5 text-sm font-medium bg-white hover:bg-linear-to-r hover:from-blue-600 hover:to-purple-600 text-slate-700 hover:text-white rounded-full border border-slate-200 hover:border-transparent transition-all duration-300 hover:shadow-md hover:scale-105"
                >
                  #{tag}
                </button>
              ));
            })()}
          </div>
        </div>

        {/* Newsletter (Optional) */}
        <div className="bg-linear-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-bold mb-2">รับข่าวสารใหม่ๆ</h3>
          <p className="text-sm text-slate-300 mb-4">
            รับบทความใหม่ก่อนใคร ทุกสัปดาห์
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="อีเมลของคุณ"
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm whitespace-nowrap transition-colors"
              disabled
            >
              สมัคร
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Coming Soon</p>
        </div>
      </div>
    </aside>
  );
}
