"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);
  const isNested = React.useContext(ResponsiveDialogContext);

  // 🛡️ Auto-Logic: Default to modal behavior unless explicitly disabled
  // Radix UI and Vaul already handle nested modals correctly by stacking them.
  const finalModal = modal ?? true;
  const finalScale = shouldScaleBackground ?? true;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // For the initial SSR and first client-side pass,
  // we return only the trigger (if exists) or null.
  // This avoids Radix UI generating mismatching internal IDs during hydration.
  if (!mounted) {
    return trigger || null;
  }

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={onSnapPointChange}
        shouldScaleBackground={finalScale}
        modal={finalModal}
      >
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent
          className={cn("max-h-[96vh] flex flex-col overflow-hidden", className)}
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <DrawerHeader className="text-left px-6 py-4 shrink-0 border-b border-slate-50">
            {title ? (
              <DrawerTitle>{title}</DrawerTitle>
            ) : (
              <VisuallyHidden>
                <DrawerTitle>Dialog</DrawerTitle>
              </VisuallyHidden>
            )}
            {description && (
              <DrawerDescription className="mt-1" asChild>
                <div>{description}</div>
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto py-2 bg-white w-full">
            <ResponsiveDialogContext.Provider value={true}>
              {children}
            </ResponsiveDialogContext.Provider>
          </div>
          {footer && (
            <DrawerFooter className="shrink-0 pb-10 border-t border-slate-50 bg-white">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={finalModal}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn("max-w-lg flex flex-col max-h-[85vh] overflow-hidden", className)}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader className="shrink-0 pb-4 border-b border-slate-50">
          {title ? (
            <DialogTitle>{title}</DialogTitle>
          ) : (
            <VisuallyHidden>
              <DialogTitle>Dialog</DialogTitle>
            </VisuallyHidden>
          )}
          {description && (
            <DialogDescription asChild>
              <div>{description}</div>
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto w-full">
          <ResponsiveDialogContext.Provider value={true}>
            {children}
          </ResponsiveDialogContext.Provider>
        </div>
        {footer && <DialogFooter className="shrink-0 pt-4 border-t border-slate-50 mt-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export { DialogClose, DrawerClose };
