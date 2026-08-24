"use client";

import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { Separator } from "@/components/ui/separator";
import { PropertySuitability } from "@/components/public/PropertySuitability";
import { User, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingType, PropertyType, PropertyStatus } from "@/features/properties/types";
import { FaLine, FaWhatsapp, } from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { type Language } from "@/lib/i18n";

import { AdminAiTriggers } from "@/components/admin/properties/AdminAiTriggers";
import { PropertySocialGenerator } from "@/features/properties/components/PropertySocialGenerator";
import type { PropertyWithDetails } from "@/features/properties/types/v3";

interface PropertyAdminSidebarProps {
  property: PropertyWithDetails & {
    embedding?: number[] | string | null;
  };
  language?: Language;
  currentUserId?: string;
  isPlatformAdmin?: boolean;
}

export function PropertyAdminSidebar({ 
  property, 
  language = "th",
  currentUserId,
  isPlatformAdmin = false
}: PropertyAdminSidebarProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-4);
    return `${d}/${m}/${y}`;
  };

  const isOwnerOrAssignee = 
    isPlatformAdmin || 
    !property.id ||
    (currentUserId && (
      property.assigned_to === currentUserId || 
      property.owner_id === currentUserId ||
      (property as any).created_by === currentUserId ||
      (property.agent && property.agent.id === currentUserId) ||
      (property.agents && property.agents.some((a: any) => (a.identity?.id || a.id) === currentUserId))
    ));

  const isEn = language === "en";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Property Status Card */}
      <div id="tour-property-status-card" className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl border border-slate-800 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-slate-400">
            {isEn ? "Status" : "สถานะ"}
          </span>
          <PropertyStatusBadge
            status={property.status || "DRAFT"}
            language={language}
          />
        </div>
        <Separator className="bg-white/10" />
        <div className="space-y-3">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-slate-400">{isEn ? "Created:" : "สร้างเมื่อ:"}</span>
            <span className="font-medium">
              {formatDate(property.created_at)}
            </span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-slate-400">{isEn ? "Updated:" : "อัปเดตล่าสุด:"}</span>
            <span className="font-medium">
              {formatDate(property.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {isOwnerOrAssignee && (
        <>
          <div id="tour-property-ai-triggers">
            <AdminAiTriggers
              propertyId={property.id}
              hasSummary={!!property.ai_summary_content}
              hasEmbedding={!!property.embedding && property.embedding.length > 0}
              requiresReview={!!property.requires_ai_review}
              isFeatured={!!property.is_featured}
            />
          </div>

          <PropertySocialGenerator propertyId={property.id} />
        </>
      )}

      <PropertySuitability
        listingType={property.listing_type || "SALE"}
        price={property.price ?? null}
        rentalPrice={property.rental_price ?? null}
        propertyType={property.property_type || "CONDO"}
        language={language}
      />

      {/* Owner Card (Protected - Hide completely for non-assigned agents to protect seller/landlord contact info) */}
      {property.owner && isOwnerOrAssignee && (
        <div id="tour-property-owner-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="px-5 py-3.5 bg-orange-500 flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                {isEn ? "Property Owner" : "เจ้าของทรัพย์"}
              </h3>
              <p className="text-[10px] text-orange-100/80">
                CRM internal data
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4 text-center">
            <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg border-2 border-white">
              {property.owner.full_name?.charAt(0).toUpperCase() || "O"}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-1">
                {property.owner.full_name}
              </h4>
              {property.property_source && (
                <Badge
                  variant="secondary"
                  className="mt-1 text-[10px] sm:text-xs h-auto max-w-full break-all whitespace-normal px-3 py-1.5"
                >
                  {property.property_source.startsWith("http://") || property.property_source.startsWith("https://") ? (
                    <a
                      href={property.property_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline cursor-pointer text-blue-600 dark:text-blue-400"
                    >
                      {property.property_source}
                    </a>
                  ) : (
                    property.property_source
                  )}
                </Badge>
              )}
            </div>

            <div className="space-y-3 pt-1 sm:pt-2">
              {property.owner.phone && (
                <Button
                  variant="outline"
                  className="w-full rounded-full gap-2 border-slate-200 h-10 sm:h-11 shadow-xs cursor-pointer"
                  asChild
                >
                  <a href={`tel:${property.owner.phone}`}>
                    <Phone className="h-4 w-4 text-blue-500" />
                    {property.owner.phone}
                  </a>
                </Button>
              )}
              {property.owner.line_id && (
                <div className="flex items-center justify-center gap-2 text-slate-600 bg-slate-50 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold border border-slate-100 px-4">
                  <FaLine className="h-4 w-4 text-[#06C755] shrink-0" />
                  <span
                    className="break-all line-clamp-1"
                    title={property.owner.line_id}
                  >
                    {property.owner.line_id}
                  </span>
                </div>
              )}
            </div>

            <Button
              asChild
              variant="ghost"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full text-xs sm:text-sm font-bold h-9 sm:h-10 cursor-pointer"
            >
              <Link href={`/protected/owners/${property.owner.id}`}>
                {isEn ? "View Owner Profile" : "ดูประวัติเจ้าของ"}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Agent Card */}
      {property.agent && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-1000">
          <div className="px-5 py-3.5 bg-slate-800 flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h3 className="font-bold text-white tracking-tight text-sm sm:text-base">
              {isEn ? "Assigned Agent" : "เอเจ้นท์ผู้รับผิดชอบ"}
            </h3>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-slate-100 shadow-sm">
                <AvatarImage
                  src={property.agent.avatar_url || ""}
                  alt={property.agent.full_name || ""}
                />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg sm:text-xl">
                  {property.agent.full_name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-base sm:text-lg">
                  {property.agent.full_name}
                </p>
                <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  {property.agent.phone || (isEn ? "No phone" : "ไม่ระบุเบอร์")}
                </div>
                {property.agent.line_id && (
                  <div className="flex items-start gap-1.5 text-[10px] sm:text-xs text-slate-400 mt-1 max-w-full">
                    <FaLine className="h-3 w-3 text-[#06C755] shrink-0 mt-0.5" />
                    <span
                      className="break-all"
                      title={property.agent.line_id}
                    >
                      Line: {property.agent.line_id}
                    </span>
                  </div>
                )}
                {property.agent.whatsapp_user_id && (
                  <div className="flex items-start gap-1.5 text-[10px] sm:text-xs text-slate-400 mt-1 max-w-full">
                    <FaWhatsapp className="h-3 w-3 text-[#25D366] shrink-0 mt-0.5" />
                    <span
                      className="break-all"
                      title={property.agent.whatsapp_user_id}
                    >
                      WhatsApp: {property.agent.whatsapp_user_id}
                    </span>
                  </div>
                )}
                {property.agent.wechat_user_id && (
                  <div className="flex items-start gap-1.5 text-[10px] sm:text-xs text-slate-400 mt-1 max-w-full">
                    <IoLogoWechat className="h-3 w-3 text-[#07C160] shrink-0 mt-0.5" />
                    <span
                      className="break-all"
                      title={property.agent.wechat_user_id}
                    >
                      WeChat: {property.agent.wechat_user_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
