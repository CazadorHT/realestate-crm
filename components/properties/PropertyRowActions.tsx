"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  MoreHorizontal,
  Share2,
  Eye,
  Edit,
  Facebook,
  Instagram,
  MessageCircle,
  Music2,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK"
  >("FACEBOOK");
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);
  
  const [postStatus, setPostStatus] = useState<
    Record<string, "idle" | "loading" | "success" | "error">
  >({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prevDialogOpen = useRef(isSocialDialogOpen);

  // Robust transition handler: Wait for the first dialog to close before opening the next one
  useEffect(() => {
    if (!isMenuOpen && nextAction) {
      const timer = setTimeout(() => {
        nextAction();
        setNextAction(null);
      }, isMobile ? 800 : 150); // Increased mobile timeout to be even safer (800ms)
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen, nextAction, isMobile]);

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
      <ResponsiveDialog
      className="xl:w-2xl"
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        title={title || "จัดการทรัพย์สิน"}
        trigger={
          <Button
            ref={triggerRef}
            variant="ghost"
            className={cn("h-8 w-8 p-0", className)}
            title="เปิดเมนู"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      >
        <div className="grid gap-4 py-2">
          {/* Management Section */}
          <div className="grid grid-cols-2 gap-2 p-1">
            <p className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider px-1 mb-1">
              General Management
            </p>

            {/* Action: View */}
            <Button
              variant="outline"
              className="justify-start h-12 text-blue-600 border-blue-100 hover:bg-blue-50 transition-all font-medium"
              asChild
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href={`/protected/properties/${id}`}>
                <Eye className="mr-3 h-5 w-5" />
                <span className="text-[14px]">ดูข้อมูล</span>
              </Link>
            </Button>

            {/* Action: Edit */}
            <Button
              variant="outline"
              className="justify-start h-12 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all font-medium"
              asChild
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href={`/protected/properties/${id}/edit`}>
                <Edit className="mr-3 h-5 w-5 text-slate-400" />
                <span className="text-[14px]">แก้ไข</span>
              </Link>
            </Button>

            {/* Action: Copy Link */}
            <Button
              variant="outline"
              className="justify-start h-12 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all font-medium"
              onClick={() => {
                setIsMenuOpen(false);
                copyPublicLink();
              }}
            >
              <Share2 className="mr-3 h-5 w-5 text-slate-400" />
              <span className="text-[14px]">คัดลอกลิงก์</span>
            </Button>

            {/* Action: Renew */}
            <Button
              variant="outline"
              className="justify-start h-12 text-blue-600 border-blue-100 hover:bg-blue-50 transition-all font-medium"
              onClick={() => {
                setIsMenuOpen(false);
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
                className="mr-3 h-5 w-5"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span className="text-[14px]">ดันประกาศ</span>
            </Button>
          </div>

          {/* Social Actions Group */}
          <div className="grid grid-cols-2 gap-2 p-1">
            <p className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider px-1 mb-1">
              Social Sharing & Marketing
            </p>
            <Button
              variant="outline"
              className="justify-start h-12 text-blue-600 border-blue-100 hover:bg-blue-50"
              disabled={postStatus["FACEBOOK"] === "loading"}
              onClick={() => {
                if (isMobile) {
                  handlePostToSocial("FACEBOOK");
                } else {
                  setIsMenuOpen(false);
                  setNextAction(() => () => handlePostToSocial("FACEBOOK"));
                }
              }}
            >
              {postStatus["FACEBOOK"] === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaFacebook className="mr-2 h-5 w-5" />
              )}
              Facebook
            </Button>

            <Button
              variant="outline"
              className="justify-start h-12 text-pink-600 border-pink-100 hover:bg-pink-50"
              disabled={postStatus["INSTAGRAM"] === "loading"}
              onClick={() => {
                if (isMobile) {
                  handlePostToSocial("INSTAGRAM");
                } else {
                  setIsMenuOpen(false);
                  setNextAction(() => () => handlePostToSocial("INSTAGRAM"));
                }
              }}
            >
              {postStatus["INSTAGRAM"] === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaInstagram className="mr-2 h-5 w-5" />
              )}
              Instagram
            </Button>

            <Button
              variant="outline"
              className="justify-start h-12 text-green-600 border-green-100 hover:bg-green-50"
              disabled={postStatus["LINE"] === "loading"}
              onClick={() => {
                if (isMobile) {
                  handlePostToSocial("LINE");
                } else {
                  setIsMenuOpen(false);
                  setNextAction(() => () => handlePostToSocial("LINE"));
                }
              }}
            >
              {postStatus["LINE"] === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaLine className="mr-2 h-5 w-5" />
              )}
              Line
            </Button>

            <Button
              variant="outline"
              className="justify-start h-12 text-slate-900 border-slate-200 hover:bg-slate-50"
              disabled={postStatus["TIKTOK"] === "loading"}
              onClick={() => {
                if (isMobile) {
                  handlePostToSocial("TIKTOK");
                } else {
                  setIsMenuOpen(false);
                  setNextAction(() => () => handlePostToSocial("TIKTOK"));
                }
              }}
            >
              {postStatus["TIKTOK"] === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaTiktok className="mr-2 h-5 w-5" />
              )}
              TikTok
            </Button>
          </div>

          {(showTransferButton || isAdmin) && (
            <>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              {showTransferButton && (
                <Button
                  variant="ghost"
                  className="w-full justify-start h-11 px-4 text-[15px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setNextAction(() => () => setShowTransferDialog(true));
                  }}
                >
                  <ArrowRightLeft className="mr-3 h-5 w-5" />
                  ย้ายสาขา
                </Button>
              )}

              <DeletePropertyMenuItem
                id={id}
                onDeleteStart={() => {
                  setIsMenuOpen(false);
                }}
              />
            </>
          )}
        </div>
      </ResponsiveDialog>

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
