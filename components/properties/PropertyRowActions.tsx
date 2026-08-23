"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { m, AnimatePresence } from "framer-motion";
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
import { softDeleteProperty } from "@/features/properties/actions/property-trash";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface SocialActionResult {
  success: boolean;
  message: string;
}

export function PropertyRowActions({
  id,
  slug,
  title,
  status,
  tenantId,
  isAdmin,
  isMultiTenant,
  className,
  cannotEdit,
}: {
  id: string;
  slug?: string | null;
  title?: string;
  status?: string;
  tenantId?: string | null;
  isAdmin?: boolean;
  isMultiTenant?: boolean;
  className?: string;
  cannotEdit?: boolean;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isMobile = useIsMobile();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK"
  >("FACEBOOK");
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [postStatus, setPostStatus] = useState<
    Record<string, "idle" | "loading" | "success" | "error">
  >({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prevDialogOpen = useRef(isSocialDialogOpen);

  // Robust transition handler: Wait for the first dialog to close before opening the next one
  useEffect(() => {
    if (!isMenuOpen && nextAction) {
      const timer = setTimeout(
        () => {
          nextAction();
          setNextAction(null);
        },
        isMobile ? 800 : 150,
      ); // Increased mobile timeout to be even safer (800ms)
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
  const canDelete = !cannotEdit;
  const handlePostToSocial = async (
    platform: "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK",
  ) => {
    setSelectedPlatform(platform);
    setIsSocialDialogOpen(true);
  };

  const copyPublicLink = async () => {
    const url = `${window.location.origin}/properties/${slug || id}`;
    await navigator.clipboard.writeText(url);
    toast.success(isEn ? "Public link copied to clipboard" : "คัดลอกลิงก์หน้า Public แล้ว");
  };

  const handleRenew = async () => {
    const promise = renewPropertyAction(id);

    toast.promise(promise, {
      loading: isEn ? "Renewing listing..." : "กำลังดันประกาศ (Renew)...",
      success: (res) => {
        if (res.success) return isEn ? "Listing renewed successfully" : "ดันประกาศสำเร็จ";
        throw new Error(res.message || (isEn ? "Error renewing" : "เกิดข้อผิดพลาด"));
      },
      error: (err) => err.message || (isEn ? "Failed to renew listing" : "เกิดข้อผิดพลาดในการดันประกาศ"),
    });
  };

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const onConfirmDelete = async () => {
    const res = await softDeleteProperty(id);
    if (res.success) {
      toast.success(isEn ? "Property moved to trash" : "ย้ายทรัพย์ลงถังขยะเรียบร้อยแล้ว");
      handleSuccessFeedback();
    } else {
      toast.error(res.error || (isEn ? "Error deleting property" : "เกิดข้อผิดพลาดในการลบ"));
      throw new Error(res.error || (isEn ? "Error deleting property" : "เกิดข้อผิดพลาดในการลบ"));
    }
  };

  return (
    <>
      <ResponsiveDialog
        className="xl:w-2xl"
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        title={title || (isEn ? "Manage Property" : "จัดการทรัพย์สิน")}
        trigger={
          <Button
            ref={triggerRef}
            variant="ghost"
            className={cn("h-8 w-8 p-0 cursor-pointer", className)}
            title={isEn ? "Open menu" : "เปิดเมนู"}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      >
        <div className="grid gap-4 py-2 px-4">
          {/* Management Section */}
          <div className="grid grid-cols-2 gap-2 p-1">
            <p className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider px-1 mb-1">
              {isEn ? "General Management" : "การจัดการทั่วไป"}
            </p>

            {/* Action: View */}
            <Button
              variant="outline"
              className="justify-start h-12 text-blue-600! border-blue-100 hover:bg-blue-50 transition-all font-medium cursor-pointer"
              asChild
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href={`/protected/properties/${id}`}>
                <Eye className="mr-3 h-5 w-5" />
                <span className="text-[14px]">{isEn ? "View Details" : "ดูข้อมูล"}</span>
              </Link>
            </Button>

            {/* Action: Edit */}
            {cannotEdit ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block w-full">
                      <Button
                        variant="outline"
                        className="justify-start h-12 text-slate-400 border-slate-200 opacity-60 w-full font-medium cursor-not-allowed"
                        disabled
                      >
                        <Edit className="mr-3 h-5 w-5 text-slate-300" />
                        <span className="text-[14px]">{isEn ? "Edit" : "แก้ไข"}</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800 p-2 text-xs">
                    {isEn ? "Cannot edit properties owned by other agents" : "ไม่สามารถแก้ไขทรัพย์สินของผู้อื่นได้"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="outline"
                className="justify-start h-12 text-slate-700! border-slate-200 hover:bg-slate-50 transition-all font-medium cursor-pointer"
                asChild
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href={`/protected/properties/${id}/edit`}>
                  <Edit className="mr-3 h-5 w-5 text-slate-400" />
                  <span className="text-[14px]">{isEn ? "Edit" : "แก้ไข"}</span>
                </Link>
              </Button>
            )}

            {/* Action: Copy Link */}
            <Button
              variant="outline"
              className="justify-start h-12 text-slate-700! border-slate-200 hover:bg-slate-50 transition-all font-medium cursor-pointer"
              onClick={() => {
                setIsMenuOpen(false);
                copyPublicLink();
              }}
            >
              <Share2 className="mr-3 h-5 w-5 text-slate-400" />
              <span className="text-[14px]">{isEn ? "Copy Link" : "คัดลอกลิงก์"}</span>
            </Button>

            {/* Action: Renew */}
            {cannotEdit ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block w-full">
                      <Button
                        variant="outline"
                        className="justify-start h-12 text-slate-400 border-slate-200 opacity-60 w-full font-medium cursor-not-allowed"
                        disabled
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-3 h-5 w-5 text-slate-300"
                        >
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                          <path d="M16 16h5v5" />
                        </svg>
                        <span className="text-[14px]">{isEn ? "Renew Listing" : "ดันประกาศ"}</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800 p-2 text-xs">
                    {isEn ? "Cannot renew properties owned by other agents" : "ไม่สามารถดันประกาศทรัพย์สินของผู้อื่นได้"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="outline"
                className="justify-start h-12 text-blue-600! border-blue-100 hover:bg-blue-50 transition-all font-medium cursor-pointer"
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
                <span className="text-[14px]">{isEn ? "Renew Listing" : "ดันประกาศ"}</span>
              </Button>
            )}
          </div>

          {/* Social Actions Group */}
          <div className="grid grid-cols-2 gap-2 p-1">
            <p className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider px-1 mb-1">
              {isEn ? "Social & Sharing" : "การแชร์และโปรโมท"}
            </p>
            <Button
              variant="outline"
              className="justify-start h-12 text-blue-600! border-blue-100 hover:bg-blue-50 cursor-pointer"
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
              className="justify-start h-12 text-pink-600! border-pink-100 hover:bg-pink-50 cursor-pointer"
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
              className="justify-start h-12 text-green-600! border-green-100 hover:bg-green-50 cursor-pointer"
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
              className="justify-start h-12 text-slate-900! border-slate-200 hover:bg-slate-50 cursor-pointer"
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

          {(showTransferButton || canDelete) && (
            <>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              {showTransferButton && (
                <Button
                  variant="ghost"
                  className="w-full justify-start h-11 px-4 text-[15px] font-medium text-blue-600! hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setNextAction(() => () => setShowTransferDialog(true));
                  }}
                >
                  <ArrowRightLeft className="mr-3 h-5 w-5" />
                  {isEn ? "Transfer Branch" : "ย้ายสาขา"}
                </Button>
              )}

              {canDelete && (
                <DeletePropertyMenuItem
                  status={status}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setNextAction(() => () => {
                      setShowDeleteDialog(true);
                      setIsDeleteConfirmed(false);
                    });
                  }}
                />
              )}
            </>
          )}
        </div>
      </ResponsiveDialog>

      {showTransferButton && (
        <TransferBranchDialog
          open={showTransferDialog}
          onOpenChangeAction={setShowTransferDialog}
          entityId={id}
          entityName={title || (isEn ? "Property" : "ทรัพย์สิน")}
          currentTenantId={tenantId}
          onTransferAction={transferPropertyBranchAction}
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

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(val) => {
          setShowDeleteDialog(val);
          if (!val) setIsDeleteConfirmed(false);
        }}
        title={isEn ? "Confirm Delete" : "ยืนยันการลบ"}
        description={
          <div className="space-y-4">
            <div className="space-y-2">
              <p>
                {isEn
                  ? "Are you sure you want to move this property to the trash? You can restore it later from Trash."
                  : "คุณต้องการย้ายทรัพย์นี้ลงถังขยะใช่หรือไม่? คุณสามารถกู้คืนได้ภายหลังในหน้าถังขยะ (Trash)"}
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 font-medium leading-relaxed">
                {isEn
                  ? "⚠️ Note: Sold/Rented listings or closed deals cannot be deleted."
                  : "⚠️ หมายเหตุ: รายการที่มีสถานะ ขายแล้ว/เช่าแล้ว หรือมีดีลที่ปิดแล้ว ไม่สามารถลบได้"}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
              <Checkbox
                id={`confirm-delete-${id}`}
                checked={isDeleteConfirmed}
                onCheckedChange={(checked) =>
                  setIsDeleteConfirmed(checked === true)
                }
              />
              <Label
                htmlFor={`confirm-delete-${id}`}
                className="text-sm font-medium text-slate-700 cursor-pointer select-none"
              >
                {isEn
                  ? "I confirm that I want to delete this listing"
                  : "ยืนยันความต้องการที่จะลบรายการนี้จริงๆ"}
              </Label>
            </div>
          </div>
        }
        confirmText={isEn ? "Move to Trash" : "ย้ายลงถังขยะ"}
        confirmDisabled={!isDeleteConfirmed}
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
