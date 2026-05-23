"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
  VisuallyHidden,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * 🛰️ ResponsiveDialog Context:
 * Helps detect nested dialogs to prevent scroll conflicts.
 */
const ResponsiveDialogContext = React.createContext(false);

/**
 * 📱 ResponsiveDialog:
 * Automatically switches between Radix Dialog (Desktop)
 * and Vaul Drawer (Mobile) based on viewport width.
 */

interface ResponsiveDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  snapPoints?: (string | number)[];
  activeSnapPoint?: string | number | null;
  onSnapPointChange?: (value: string | number | null) => void;
  shouldScaleBackground?: boolean;
  modal?: boolean;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  scrollable?: boolean;
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  minHeight?: string;
  showCloseButton?: boolean;
  confirmOnClose?: boolean;
}

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  className,
  snapPoints,
  activeSnapPoint,
  onSnapPointChange,
  shouldScaleBackground,
  modal,
  onOpenAutoFocus,
  onCloseAutoFocus,
  scrollable = true,
  isLoading = false,
  loadingText,
  minHeight = "200px",
  showCloseButton = true,
  confirmOnClose,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);
  const isNested = React.useContext(ResponsiveDialogContext);
  const [isDirty, setIsDirty] = React.useState(false);
  const [showConfirmClose, setShowConfirmClose] = React.useState(false);

  // 🛡️ Auto-Logic: Default to modal behavior unless explicitly disabled
  const finalModal = modal ?? true;
  const finalScale = shouldScaleBackground ?? false;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      setIsDirty(false);
    }
  }, [open]);

  const handleInteract = () => {
    setIsDirty(true);
  };

  const handleConfirmExit = () => {
    setShowConfirmClose(false);
    onOpenChange?.(false);
  };

  const handleCancelExit = () => {
    setShowConfirmClose(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    const shouldConfirm = confirmOnClose !== undefined ? confirmOnClose : isDirty;
    if (!newOpen && shouldConfirm) {
      setShowConfirmClose(true);
    } else {
      onOpenChange?.(newOpen);
    }
  };

  if (!mounted) {
    return trigger || null;
  }

  const renderConfirmCloseDialog = () => {
    if (!showConfirmClose) return null;
    return (
      <ResponsiveDialog
        open={showConfirmClose}
        onOpenChange={setShowConfirmClose}
        title="ยืนยันการออกจากหน้าต่าง"
        description="ข้อมูลที่คุณกรอกหรือแก้ไขอาจไม่ได้รับการบันทึก คุณแน่ใจหรือไม่ที่จะออกจากหน้านี้?"
        className="sm:max-w-sm! z-200"
        confirmOnClose={false}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              type="button"
              onClick={handleCancelExit}
              className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={handleConfirmExit}
              className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
            >
              ยืนยันการออก
            </Button>
          </div>
        }
      />
    );
  };

  const renderContent = () => {
    return (
      <div
        className="relative w-full h-full"
        style={{ minHeight: isLoading ? minHeight : undefined }}
        onInput={handleInteract}
        onChange={handleInteract}
      >
        <AnimatePresence>
          {isLoading && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-white/60 backdrop-blur-[2px] backdrop-saturate-150 rounded-b-xl"
            >
              <div className="relative flex flex-col items-center gap-4">
                {/* Outer pulsing ring */}
                <m.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                  className="absolute -inset-4 bg-blue-500/5 rounded-full blur-xl"
                />

                {/* Spinner inside a ring */}
                <div className="relative h-12 w-12">
                  <m.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="absolute inset-0 border-3 border-slate-100 rounded-full"
                  />
                  <m.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                    className="absolute inset-0 border-3 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <m.div
                      animate={{ scale: [0.8, 1, 0.8] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
                      <Loader2 className="h-5 w-5 text-blue-600" />
                    </m.div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 text-center">
                  <p className="text-sm font-bold text-slate-900 tracking-tight">
                    {loadingText || "กำลังประมวลผล..."}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest animate-pulse">
                    Please wait
                  </p>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
        <div
          className={cn(
            isLoading && "opacity-40 grayscale pointer-events-none",
          )}
        >
          {children}
        </div>
      </div>
    );
  };

  const handlePointerDownOutside = (e: Event) => {
    const shouldConfirm = confirmOnClose !== undefined ? confirmOnClose : isDirty;
    if (shouldConfirm) {
      e.preventDefault();
      setShowConfirmClose(true);
    }
  };

  const handleEscapeKeyDown = (e: Event) => {
    const shouldConfirm = confirmOnClose !== undefined ? confirmOnClose : isDirty;
    if (shouldConfirm) {
      e.preventDefault();
      setShowConfirmClose(true);
    }
  };

  if (isMobile) {
    const shouldConfirm = confirmOnClose !== undefined ? confirmOnClose : isDirty;
    return (
      <>
        <Drawer
          open={open}
          onOpenChange={handleOpenChange}
          snapPoints={snapPoints}
          activeSnapPoint={activeSnapPoint}
          setActiveSnapPoint={onSnapPointChange}
          shouldScaleBackground={finalScale}
          modal={finalModal}
          dismissible={!shouldConfirm}
        >
          {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
          <DrawerContent
            className={cn(
              "max-h-[96vh] flex flex-col pointer-events-auto",
              className,
            )}
            onOpenAutoFocus={onOpenAutoFocus}
            onCloseAutoFocus={onCloseAutoFocus}
            onPointerDownOutside={handlePointerDownOutside}
            onEscapeKeyDown={handleEscapeKeyDown}
          >
            {title ? (
              <DrawerHeader className="shrink-0 text-left px-6 pt-5 pb-5 border-b border-slate-100 relative z-20 bg-white">
                <DrawerTitle>{title}</DrawerTitle>
                {description && (
                  <DrawerDescription
                    className="mt-1 text-[13px] leading-relaxed"
                    asChild
                  >
                    <div>{description}</div>
                  </DrawerDescription>
                )}
              </DrawerHeader>
            ) : (
              <VisuallyHidden>
                <DrawerTitle>Dialog</DrawerTitle>
                <DrawerDescription>
                  Dialog description for accessibility
                </DrawerDescription>
              </VisuallyHidden>
            )}
            {!description && title && (
              <VisuallyHidden>
                <DrawerDescription>
                  Dialog description for accessibility
                </DrawerDescription>
              </VisuallyHidden>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white w-full relative z-10 transition-all duration-300">
              <ResponsiveDialogContext.Provider value={true}>
                {renderContent()}
              </ResponsiveDialogContext.Provider>
            </div>
            {footer && (
              <DrawerFooter className="shrink-0 pb-10 border-t border-slate-50 bg-white">
                {footer}
              </DrawerFooter>
            )}
          </DrawerContent>
        </Drawer>
        {renderConfirmCloseDialog()}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange} modal={finalModal}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          className={cn(
            "max-w-lg flex flex-col max-h-[85vh] pointer-events-auto",
            className,
          )}
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
          showCloseButton={showCloseButton}
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={handleEscapeKeyDown}
        >
          {title ? (
            <DialogHeader className="shrink-0 px-6 pt-6 pb-5 pr-6 border-b border-slate-100">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription
                  className="mt-1 text-[13px] text-slate-500 font-medium leading-relaxed"
                  asChild
                >
                  <div>{description}</div>
                </DialogDescription>
              )}
            </DialogHeader>
          ) : (
            <VisuallyHidden>
              <DialogTitle>Dialog</DialogTitle>
              <DialogDescription>
                Dialog description for accessibility
              </DialogDescription>
            </VisuallyHidden>
          )}
          {!description && title && (
            <VisuallyHidden>
              <DialogDescription>
                Dialog description for accessibility
              </DialogDescription>
            </VisuallyHidden>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto w-full relative z-10 transition-all duration-300">
            <ResponsiveDialogContext.Provider value={true}>
              {renderContent()}
            </ResponsiveDialogContext.Provider>
          </div>
          {footer && (
            <DialogFooter className="shrink-0 pt-4 border-t border-slate-50 mt-2">
              {footer}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      {renderConfirmCloseDialog()}
    </>
  );
}

export { DialogClose, DrawerClose };
