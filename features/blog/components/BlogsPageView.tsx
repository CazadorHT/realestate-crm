"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlogsTable } from "./BlogsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BlogStats } from "./BlogStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";
import { BlogPost } from "@/lib/services/blog";
import { useLanguage } from "@/lib/i18n/language-context";

interface BlogsPageViewProps {
  posts: BlogPost[];
  totalPosts: number;
  page: number;
  tab: string;
}

export function BlogsPageView({
  posts,
  totalPosts,
  page,
  tab,
}: BlogsPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isTrash = tab === "trash";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={
          isTrash
            ? isEn
              ? "Articles Trash"
              : "ถังขยะบทความ"
            : isEn
              ? "Articles & News"
              : "จัดการบทความ"
        }
        subtitle={
          isTrash
            ? isEn
              ? "Manage deleted articles, restore or permanently delete them"
              : "จัดการบทความที่ถูกลบชั่วคราว คุณสามารถกู้คืนหรือลบทิ้งถาวรได้"
            : isEn
              ? "Create and manage website articles, news, and SEO content"
              : "สร้างและจัดการเนื้อหาบทความ ข่าวสาร และ SEO บนเว็บไซต์ของคุณ"
        }
        count={totalPosts}
        icon={isTrash ? "history" : "fileText"}
        gradient={isTrash ? "rose" : "blue"}
        breadcrumbs={[
          { label: isEn ? "Dashboard" : "แดชบอร์ด", href: "/protected" },
          { label: isEn ? "Articles & News" : "จัดการบทความ" },
        ]}
        actionSlot={
          !isTrash && (
            <Button
              asChild
              className="flex flex-1 bg-white hover:bg-blue-700 hover:text-white text-blue-600 duration-300 transition-all font-semibold rounded-xl shadow-sm cursor-pointer"
            >
              <Link href="/protected/blogs/new">
                <Plus className="mr-2 h-4 w-4" />
                {isEn ? "Create New Article" : "สร้างบทความใหม่"}
              </Link>
            </Button>
          )
        }
      />

      {/* Statistics Cards */}
      {!isTrash && <BlogStats posts={posts} />}

      <BlogsTable posts={posts} totalCount={totalPosts} currentPage={page} />

      {posts && posts.length > 0 && (
        <TableFooterStats
          totalCount={totalPosts}
          unitLabel={isEn ? "articles" : "บทความ"}
        />
      )}
    </div>
  );
}
