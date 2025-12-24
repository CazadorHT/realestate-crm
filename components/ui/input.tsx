import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Avoid React warning when `value` prop is explicitly `null`.
    // If a caller passes `value: null` we normalize it to empty string.
    const hasValueProp = Object.prototype.hasOwnProperty.call(props, "value");
    const safeValue = hasValueProp ? (props.value ?? "") : undefined;

    // Copy props but ensure we don't accidentally set `value` to null
    const inputProps: any = { ...props };
    if (safeValue !== undefined) {
      inputProps.value = safeValue;
    } else {
      // Ensure uncontrolled inputs remain uncontrolled
      delete inputProps.value;
    }

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:!border-red-500 aria-[invalid=true]:focus-visible:!ring-red-500",
          className
        )}
        {...inputProps}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
