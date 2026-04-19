"use client";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Eye } from "lucide-react";
import { QuickShareButton } from "@/features/properties/components/QuickShareButton";
import { FacebookPostButton } from "@/features/properties/components/FacebookPostButton";
import { InstagramPostButton } from "@/features/properties/components/InstagramPostButton";
import { LinePostButton } from "@/features/properties/components/LinePostButton";
import { TikTokPostButton } from "@/features/properties/components/TikTokPostButton";
import type { PropertyImage } from "@/features/properties/types";

interface PropertyAdminHeaderProps {
  property: {
    id: string;
    title: string;
    slug?: string | null;
  };
  images: PropertyImage[];
}

export function PropertyAdminHeader({ property, images }: PropertyAdminHeaderProps) {
  return (
    <>
      {/* 1. Admin Breadcrumb & Edit Button */}
      <div className="pt-6 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-4">
          <Breadcrumb
            backHref={`/protected/properties`}
            items={[
              { label: "โครงการและทรัพย์สิน", href: "/protected/properties" },
              { label: property.title || "รายละเอียด" },
            ]}
          />
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 lg:flex-none rounded-full bg-white text-slate-600 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10 px-4"
          >
            <Link
              href={`/properties/${property.slug || property.id}`}
              target="_blank"
            >
              <Eye className="h-4 w-4 mr-2" />
              ดูหน้าเว็บ
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 lg:flex-none rounded-full bg-white text-slate-600 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10 px-4"
          >
            <Link href={`/protected/properties/${property.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              แก้ไข
            </Link>
          </Button>
        </div>
      </div>
      <div className="lg:gap-4 flex items-center justify-end px-4 sm:px-6 lg:px-8 border-t pt-4 border-slate-100 gap-2 flex-wrap">
        <QuickShareButton
          property={
            {
              ...(property as any),
              cover_image_url:
                images.find((img) => img.is_cover)?.image_url ||
                images[0]?.image_url,
            }
          }
          className="flex-1 lg:flex-none h-10 px-6"
        />
        <FacebookPostButton
          propertyId={property.id}
          propertyTitle={property.title}
          variant="outline"
          className="flex-1 lg:flex-none rounded-full bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10 px-4"
        />

        <InstagramPostButton
          propertyId={property.id}
          propertyTitle={property.title}
          variant="outline"
          className="flex-1 lg:flex-none rounded-full bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10 px-4"
        />

        <LinePostButton
          propertyId={property.id}
          propertyTitle={property.title}
          variant="outline"
          className="flex-1 lg:flex-none rounded-full bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10 px-4"
        />

        <TikTokPostButton
          propertyId={property.id}
          propertyTitle={property.title}
          variant="outline"
          className="flex-1 lg:flex-none rounded-full bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10 px-4"
        />
      </div>
    </>
  );
}
