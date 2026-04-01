import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        add: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500/20 shadow-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 shadow-sm",
        outline:
          "border border-blue-600 cursor-pointer text-blue-600 bg-white hover:bg-blue-600  duration-300 transition-all font-medium shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        cancel:
          "bg-white border-2 border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50/50 shadow-sm",
        link: "text-primary underline-offset-4 hover:underline",

        // เพิ่มเติมที่น่าสนใจ
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500/20 shadow-sm",
        soft: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };
function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  // ✅ สำคัญ: ถ้าเป็นปุ่มจริง ๆ (ไม่ใช่ asChild) และไม่ได้ระบุ type → default เป็น button
  const safeType = asChild ? undefined : (type ?? "button");

  return (
    <Comp
      data-slot="button"
      className={cn(
        "cursor-pointer",
        buttonVariants({ variant, size, className }),
      )}
      {...props}
      {...(!asChild ? { type: safeType } : {})}
    />
  );
}

export { Button, buttonVariants };
