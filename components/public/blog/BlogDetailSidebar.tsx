"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";
import { ShareButtons } from "@/components/public/ShareButtons";

interface BlogDetailSidebarProps {
  slug: string;
  title: string;
  relatedPosts: any[];
}

export function BlogDetailSidebar({
  slug,
  title,
  relatedPosts,
}: BlogDetailSidebarProps) {
  return (
    <aside className="lg:col-span-3">
      <div className="sticky top-24 space-y-6">
        {/* Share Buttons */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            แชร์บทความนี้
          </h3>
          <ShareButtons
            url={
              typeof window !== "undefined"
                ? window.location.href
                : `https://your-domain.com/blog/${slug}`
            }
            title={title}
          />
        </div>

        {/* Related Posts in Sidebar */}
        {relatedPosts.length > 0 && (
          <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              บทความที่เกี่ยวข้อง
            </h3>
            <div className="space-y-4">
              {relatedPosts.slice(0, 3).map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="block group"
                >
                  <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 text-sm">
                      {relatedPost.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {relatedPost.reading_time || "5 min read"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Card */}
        <div className="bg-linear-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-bold mb-2">ต้องการความช่วยเหลือ?</h3>
          <p className="text-sm text-slate-300 mb-4">
            ปรึกษาผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ ฟรี!
          </p>
          <Link href="/contact">
            <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
              ติดต่อเรา
            </button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
