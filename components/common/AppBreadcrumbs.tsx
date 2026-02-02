"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { useMemo } from "react";

const routeLabels: Record<string, string> = {
  // Common
  home: "หน้าแรก",
  search: "ค้นหา",
  about: "เกี่ยวกับเรา",
  contact: "ติดต่อเรา",
  blog: "บทความ",
  blogs: "บทความ",
  category: "หมวดหมู่",
  tags: "แท็ก",

  // Public Properties
  properties: "โครงการและทรัพย์สิน",
  rent: "เช่า",
  sale: "ขาย",

  // Auth
  auth: "เข้าสู่ระบบ",
  login: "ลงชื่อเข้าใช้",
  register: "ลงทะเบียน",

  // CRM / Protected
  protected: "ระบบจัดการ",
  admin: "ผู้ดูแลระบบ",
  dashboard: "แดชบอร์ด",
  calendar: "ปฏิทิน",
  contracts: "สัญญา",
  deals: "ดีล",
  documents: "เอกสาร",
  faqs: "คำถามที่พบบ่อย",
  leads: "ลูกค้ามุ่งหวัง",
  owners: "เจ้าของทรัพย์",
  partners: "พาร์ทเนอร์",
  profile: "โปรไฟล์",
  settings: "ตั้งค่า",
  users: "ผู้ใช้งาน",
  roles: "บทบาท",
  new: "เพิ่มใหม่",
  edit: "แก้ไข",
  details: "รายละเอียด",
  view: "ดูข้อมูล",
};

interface AppBreadcrumbsProps {
  className?: string;
  variant?: "default" | "on-dark";
  showHome?: boolean;
  items?: { label: string; href?: string }[];
}

export function AppBreadcrumbs({
  className,
  variant = "default",
  showHome = true,
  items: customItems,
}: AppBreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (customItems) return customItems;

    // Split pathname into segments and filter out empty strings
    const segments = pathname.split("/").filter(Boolean);

    const items: BreadcrumbItem[] = [];

    // Add Home if requested
    if (showHome) {
      items.push({
        label: routeLabels["home"],
        href: "/",
      });
    }

    let currentHref = "";

    segments.forEach((segment) => {
      // Don't show "protected" in breadcrumbs if we show "home" or other segments
      // Or map it to something meaningful if it's the only segment
      if (segment === "protected" && segments.length > 1) {
        currentHref += `/${segment}`;
        return;
      }

      currentHref += `/${segment}`;

      // Try to find a label in the map, otherwise use the capitalized segment
      const label =
        routeLabels[segment.toLowerCase()] ||
        decodeURIComponent(segment)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

      items.push({
        label,
        href: currentHref,
      });
    });

    // Debug log to verify props
    // Debug log removed to prevent TS error
    // console.log("AppBreadcrumbs rendered", { ... });

    return items;
  }, [pathname, showHome, customItems]);

  // Schema.org for SEO
  const schemaData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href ? `https://your-domain.com${item.href}` : undefined,
      })),
    };
  }, [breadcrumbs]);

  // If we're on the home page and not showing home explicitly, or if there are no items
  if (pathname === "/" || breadcrumbs.length <= (showHome ? 1 : 0)) {
    return null;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <Breadcrumb items={breadcrumbs} variant={variant} className={className} />
    </>
  );
}
