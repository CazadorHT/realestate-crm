"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Share2,
  Facebook,
  Instagram,
  MessageCircle,
  Music2,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { DeletePropertyMenuItem } from "./DeletePropertyMenuItem";
import { renewPropertyAction } from "@/features/properties/renew-action";
import { postPropertyToMetaAction } from "@/features/properties/actions/social";
import { postPropertyToLineAction } from "@/features/properties/actions/line";
import { postPropertyToTikTokAction } from "@/features/properties/actions/tiktok";
import { SocialPostDialog } from "@/features/properties/components/SocialPostDialog";
import { dispatchSocialPostEvent } from "@/lib/social-post-events";
import { transferPropertyBranchAction } from "@/lib/actions/transfer-branch-action";
import { TransferBranchDialog } from "@/components/shared/TransferBranchDialog";
import { v4 as uuidv4 } from "uuid";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface SocialActionResult {
  success: boolean;
  message: string;
}

export function PropertyRowActions({
  id,
  title,
  tenantId,
  isAdmin,
  isMultiTenant,
  className,
}: {
  id: string;
  title?: string;
  tenantId?: string | null;
  isAdmin?: boolean;
  isMultiTenant?: boolean;
  className?: string;
}) {
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK"
  >("FACEBOOK");
  const [postStatus, setPostStatus] = useState<
    Record<string, "idle" | "loading" | "success" | "error">
  >({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prevDialogOpen = useRef(isSocialDialogOpen);

  useEffect(() => {
    if (prevDialogOpen.current && !isSocialDialogOpen) {
      // Small timeout to ensure the dialog is fully gone from the DOM
      const timer = setTimeout(() => {
        triggerRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    prevDialogOpen.current = isSocialDialogOpen;
  }, [isSocialDialogOpen]);
  const showTransferButton = isAdmin && isMultiTenant;
  const handlePostToSocial = async (
    platform: "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK",
  ) => {
    setSelectedPlatform(platform);
    setIsSocialDialogOpen(true);
  };

  const copyPublicLink = async () => {
    const url = `${window.location.origin}/properties/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์หน้า Public แล้ว");
  };



  const handleRenew = async () => {
    const promise = renewPropertyAction(id);
    
    toast.promise(promise, {
      loading: "กำลังดันประกาศ (Renew)...",
      success: (res) => {
        if (res.success) return "ดันประกาศสำเร็จ";
        throw new Error(res.message || "เกิดข้อผิดพลาด");
      },
      error: (err) => err.message || "เกิดข้อผิดพลาดในการดันประกาศ",
    });
  };

  return (
    <>
      

      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} variant="ghost" className={cn("h-8 w-8 p-0", className)}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[250px]">
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              copyPublicLink();
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            คัดลอกลิงก์ Public
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-blue-600 focus:text-blue-700"
            onSelect={(e) => {
              e.preventDefault();
              handleRenew();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-4 w-4"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            ดันประกาศ (Renew)
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-blue-600 focus:text-blue-700"
            disabled={postStatus["FACEBOOK"] === "loading"}
            onSelect={() => {
              handlePostToSocial("FACEBOOK");
            }}
          >
            {postStatus["FACEBOOK"] === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaFacebook className="mr-2 h-4 w-4" />
            )}
            โพสต์ลง Facebook
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-pink-600 focus:text-pink-700"
            disabled={postStatus["INSTAGRAM"] === "loading"}
            onSelect={() => {
              handlePostToSocial("INSTAGRAM");
            }}
          >
            {postStatus["INSTAGRAM"] === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaInstagram className="mr-2 h-4 w-4" />
            )}
            โพสต์ลง Instagram
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-green-600 focus:text-green-700"
            disabled={postStatus["LINE"] === "loading"}
            onSelect={() => {
              handlePostToSocial("LINE");
            }}
          >
            {postStatus["LINE"] === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaLine className="mr-2 h-4 w-4" />
            )}
            ส่งลง Line (Broadcast)
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-slate-900"
            disabled={postStatus["TIKTOK"] === "loading"}
            onSelect={() => {
              handlePostToSocial("TIKTOK");
            }}
          >
            {postStatus["TIKTOK"] === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaTiktok className="mr-2 h-4 w-4" />
            )}
            โพสต์ลง TikTok
          </DropdownMenuItem>

          {showTransferButton && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-blue-600 focus:text-blue-700"
                onSelect={(e) => {
                  e.preventDefault();
                  setShowTransferDialog(true);
                }}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                ย้ายสาขา
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DeletePropertyMenuItem id={id} />
        </DropdownMenuContent>
      </DropdownMenu>

      {showTransferButton && (
        <TransferBranchDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          entityId={id}
          entityName={title || "ทรัพย์สิน"}
          currentTenantId={tenantId}
          onTransfer={transferPropertyBranchAction}
        />
      )}

      <SocialPostDialog
        propertyId={id}
        propertyTitle={title}
        platform={selectedPlatform}
        isOpen={isSocialDialogOpen}
        onOpenChange={setIsSocialDialogOpen}
        onSuccess={() => {
          setPostStatus((prev) => ({ ...prev, [selectedPlatform]: "success" }));
        }}
      />
    </>
  );
}
