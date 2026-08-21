"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Eye, Layers, Loader2, MoreVertical, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QuickShareButton } from "@/features/properties/components/QuickShareButton";
import { FacebookPostButton } from "@/features/properties/components/FacebookPostButton";
import { InstagramPostButton } from "@/features/properties/components/InstagramPostButton";
import { LinePostButton } from "@/features/properties/components/LinePostButton";
import { TikTokPostButton } from "@/features/properties/components/TikTokPostButton";
import { DownloadAllImagesButton } from "@/features/properties/components/DownloadAllImagesButton";
import { SocialStudioModal } from "@/components/social-studio/SocialStudioModal";
import { SocialPostDialog } from "@/features/properties/components/SocialPostDialog";
import { type Language } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import type { PropertyWithDetails, PropertyImageV3 } from "@/features/properties/types/v3";
import { cn } from "@/lib/utils";
import {toast} from "sonner";
import { m } from "framer-motion";

interface PropertyAdminHeaderProps {
  property: PropertyWithDetails;
  images: PropertyImageV3[];
  language?: Language;
  currentUserId?: string;
  isPlatformAdmin?: boolean;
}

export function PropertyAdminHeader({ 
  property, 
  images, 
  language = "th",
  currentUserId,
  isPlatformAdmin = false
}: PropertyAdminHeaderProps) {
  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const coverImage = images.find((img) => img.is_cover)?.url || images[0]?.url;

  // Check if current user is owner of the property OR assigned agent OR is an administrator
  const isOwnerOrAssignee = 
    isPlatformAdmin || 
    (currentUserId && (
      property.assigned_to === currentUserId || 
      property.owner_id === currentUserId ||
      (property.agents && property.agents.some((a: any) => a.identity?.id === currentUserId))
    ));

  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [appliedCoverUrl, setAppliedCoverUrl] = useState<string | null>(null);

  const studioProperty = useMemo(() => {
    const primaryAgent = (property.agents as any)?.[0]?.identity;
    return {
      id: property.id,
      slug: property.slug,
      title: property.title || "",
      project_id: (property as any).project_id ?? (property as any).project?.id ?? null,
      project_name: (() => {
        const pName = (property as any).project_name;
        if (typeof pName === "string" && pName.trim()) return pName.trim();
        const proj = (property as any).project;
        if (proj?.name) {
          if (typeof proj.name === "object") {
            return proj.name.th || proj.name.en || proj.name.cn || proj.name.ru || null;
          }
          if (typeof proj.name === "string" && proj.name.trim()) return proj.name.trim();
        }
        return (property as any).details?.meta_data?.project_name ?? null;
      })(),
      project: (property as any).project ?? null,
      property_type: property.property_type,
      listing_type: property.listing_type,
      price: (property as any).price ?? (property as any).sale_price,
      rental_price: (property as any).rental_price ?? (property as any).rent_price,
      popular_area: (property as any).popular_area,
      popular_area_en: (property as any).popular_area_en ?? null,
      popular_area_cn: (property as any).popular_area_cn ?? null,
      popular_area_ru: (property as any).popular_area_ru ?? null,
      province: (property as any).province,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size_sqm: (property as any).size_sqm ?? (property as any).floor_area,
      floor: (property as any).floor,
      transit_type: (property as any).transit_type ?? (property as any).transit?.type ?? null,
      transit_station_name: (property as any).transit_station_name,
      transit_station_name_en: (property as any).transit_station_name_en ?? null,
      transit_station_name_cn: (property as any).transit_station_name_cn ?? null,
      transit_station_name_ru: (property as any).transit_station_name_ru ?? null,
      images: [...images]
        .sort((a, b) => {
          if (a.is_cover && !b.is_cover) return -1;
          if (!a.is_cover && b.is_cover) return 1;
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        })
        .map((img) => ({
          url: img.url,
          is_cover: img.is_cover,
          sort_order: img.sort_order,
        })),
      assigned_agent: primaryAgent
        ? {
            full_name: primaryAgent.display_name,
            phone: primaryAgent.phone,
            line_id: primaryAgent.line_id,
          }
        : null,
    };
  }, [property, images]);

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-xs">
      {/* 1. Command Bar: Title, ID & Primary Actions */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <m.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1"
        >
          <Breadcrumb
            backHref={`/protected/properties`}
            items={[
              { label: "โครงการและทรัพย์สิน", href: "/protected/properties" },
              { label: "จัดการทรัพย์สิน" },
            ]}
          />
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight max-w-[300px] sm:max-w-[500px] truncate">
              {property.title || "ไม่มีชื่อทรัพย์"}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-mono text-[10px] px-2 py-0">
                ID: {property.id.slice(0, 8).toUpperCase()}
              </Badge>
              {property.verified && (
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              )}
            </div>
          </div>
        </m.div>
 
        <div className="flex items-center gap-2 lg:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 md:flex-none rounded-xl text-slate-500 hover:bg-slate-100 transition-all duration-200 h-10 px-4 font-bold"
            onClick={() => {
              setNavigatingId("view");
              window.open(`/properties/${property.slug || property.id}`, "_blank");
              setNavigatingId(null);
            }}
            disabled={navigatingId === "view"}
          >
            {navigatingId === "view" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">ดูหน้าเว็บ</span>
            <span className="sm:hidden">พรีวิว</span>
          </Button>
 
          <Button
            variant="default"
            size="sm"
            className="flex-1 md:flex-none rounded-xl bg-slate-900 hover:bg-blue-600 text-white transition-all duration-300 shadow-lg shadow-slate-200/50 h-10 px-5 font-bold disabled:opacity-50 disabled:hover:bg-slate-900"
            onClick={() => {
              setNavigatingId("edit");
              router.push(`/protected/properties/${property.id}/edit`);
            }}
            disabled={navigatingId === "edit" || !isOwnerOrAssignee}
            title={!isOwnerOrAssignee ? "สิทธิ์การแก้ไขเฉพาะเจ้าของทรัพย์หรือแอดมินเท่านั้น" : undefined}
          >
            {navigatingId === "edit" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            แก้ไขทรัพย์สิน
          </Button>
 
          {isOwnerOrAssignee && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
                  <MoreVertical className="h-5 w-5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                <DropdownMenuItem 
                  className="rounded-xl gap-2 py-2.5 font-medium cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("คัดลอกลิงก์เรียบร้อย");
                  }}
                >
                  <Copy className="h-4 w-4 text-slate-400" /> คัดลอกลิงก์ภายใน
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl gap-2 py-2.5 font-medium cursor-pointer">
                  <Layers className="h-4 w-4 text-slate-400" /> สร้างรายการที่คล้ายกัน
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-50" />
                <DropdownMenuItem className="rounded-xl gap-2 py-2.5 font-medium cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> ลบทรัพย์สินนี้
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 2. Social Action Bar: Optimized for Multi-channel */}
      <div className="bg-slate-50/50 py-3 border-t border-slate-100/50">
        <div className="px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <QuickShareButton
              property={{
                ...property,
                title: property.title || "-",
                cover_image_url: coverImage || undefined,
              }}
              className="h-9 px-5 rounded-full shadow-sm hover:shadow-md transition-all font-bold text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStudioOpen(true)}
              className="h-9 px-4 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-800 border-amber-200 shadow-xs transition-all font-bold text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600! animate-pulse" />
              <span>สร้างภาพ Social Story</span>
            </Button>
            <DownloadAllImagesButton
              images={images}
              propertyId={property.id}
              propertyTitle={property.title || undefined}
              className="h-9 px-4 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200 shadow-xs font-bold text-xs"
            />
            <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">Social Posting</p>
          </div>

          <m.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            {[
              { component: FacebookPostButton, color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600" },
              { component: InstagramPostButton, color: "bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-600" },
              { component: LinePostButton, color: "bg-green-50 text-green-600 border-green-100 hover:bg-green-600" },
              { component: TikTokPostButton, color: "bg-slate-900 text-white border-slate-800 hover:bg-black" }
            ].map((btn, idx) => (
              <m.div key={idx} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                <btn.component
                  propertyId={property.id}
                  propertyTitle={property.title || ""}
                  variant="outline"
                  className={cn(
                    "rounded-full transition-all duration-300 shadow-none hover:text-white h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold",
                    btn.color
                  )}
                />
              </m.div>
            ))}
          </m.div>
        </div>
      </div>

      {/* AI Social Media Studio Modal */}
      {isStudioOpen && (
        <SocialStudioModal
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          property={studioProperty}
          onApplyCoverToPost={(coverDataUrl) => {
            setIsStudioOpen(false);
            setAppliedCoverUrl(coverDataUrl);
            setIsPostDialogOpen(true);
          }}
        />
      )}

      {isPostDialogOpen && (
        <SocialPostDialog
          isOpen={isPostDialogOpen}
          onOpenChange={setIsPostDialogOpen}
          propertyId={property.id}
          propertyTitle={property.title || ""}
          platform="FACEBOOK"
          initialCoverUrl={appliedCoverUrl || undefined}
        />
      )}
    </div>
  );
}
