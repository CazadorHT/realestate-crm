"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-white group-[.toaster]:!bg-opacity-100 group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:!bg-slate-950 dark:group-[.toaster]:!bg-opacity-100 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800",
          description:
            "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400",
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500",
          closeButton:
            "group-[.toast]:!left-auto group-[.toast]:!right-[-6px] group-[.toast]:!top-[-6px] group-[.toast]:!size-7 group-[.toast]:bg-white group-[.toast]:!text-red-500 group-[.toast]:!border-red-100 group-[.toast]:!hover:bg-red-600 group-[.toast]:!hover:text-white group-[.toast]:transition-all group-[.toast]:shadow-md group-[.toast]:flex group-[.toast]:items-center group-[.toast]:justify-center group-[.toast]:opacity-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
