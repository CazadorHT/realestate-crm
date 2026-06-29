import * as React from "react";

import { cn } from "@/lib/utils";

const formatPhone = (val: string) => {
  const hasPlus = val.startsWith("+");
  let digits = val.replace(/[^\d]/g, "");
  
  if (hasPlus) {
    digits = digits.slice(0, 11);
    if (digits.startsWith("66")) {
      const rest = digits.slice(2);
      if (rest.length === 0) return "+66";
      if (rest.length <= 2) return `+66 ${rest}`;
      if (rest.length <= 5) return `+66 ${rest.slice(0, 2)}-${rest.slice(2)}`;
      return `+66 ${rest.slice(0, 2)}-${rest.slice(2, 5)}-${rest.slice(5, 9)}`;
    } else {
      if (digits.length <= 3) return `+${digits}`;
      if (digits.length <= 6) return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
  } else {
    digits = digits.slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Avoid React warning when `value` prop is explicitly `null`.
    // If a caller passes `value: null` we normalize it to empty string.
    const hasValueProp = Object.prototype.hasOwnProperty.call(props, "value");
    const safeValue = hasValueProp ? (props.value ?? "") : undefined;

    // Detect field types based on name and HTML type
    const isPhone = type === "tel" || 
      props.name === "phone" || 
      props.name === "whatsapp" ||
      props.name?.endsWith("phone") || 
      props.name?.endsWith("Phone") ||
      props.name?.endsWith("whatsapp") ||
      props.name?.endsWith("Whatsapp");

    const isEmail = type === "email" || 
      props.name === "email" ||
      props.name?.endsWith("email") ||
      props.name?.endsWith("Email");

    const isLineId = props.name === "line_id" || 
      props.name === "lineId" ||
      props.name?.endsWith("lineId") ||
      props.name?.endsWith("LineId") ||
      props.name === "lineId-mobile" ||
      props.name === "lineId-desktop";

    const isUrl = type === "url" ||
      props.name === "url" ||
      props.name === "website" ||
      props.name?.includes("link") ||
      props.name?.includes("Link") ||
      props.name?.includes("facebook") ||
      props.name?.includes("Facebook");

    const isPostal = props.name === "postal_code" || 
      props.name === "postalCode" || 
      props.name === "zip_code" || 
      props.name === "zipCode";

    // Copy props but ensure we don't accidentally set `value` to null
    const inputProps: any = { ...props };
    if (safeValue !== undefined) {
      inputProps.value = safeValue;
    } else {
      // Ensure uncontrolled inputs remain uncontrolled
      delete inputProps.value;
    }

    // Intercept onChange to sanitize inputs based on type
    const originalOnChange = props.onChange;
    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isPhone) {
        let val = e.target.value;
        e.target.value = formatPhone(val);
      } else if (isEmail) {
        let val = e.target.value;
        // Strip all spaces and convert to lowercase
        e.target.value = val.replace(/\s+/g, "").toLowerCase();
      } else if (isLineId) {
        let val = e.target.value;
        // Strip all spaces
        e.target.value = val.replace(/\s+/g, "");
      } else if (isUrl) {
        let val = e.target.value;
        // Strip spaces
        e.target.value = val.trim();
      } else if (isPostal) {
        let val = e.target.value;
        // Keep only digits, max 5 characters
        e.target.value = val.replace(/[^\d]/g, "").slice(0, 5);
      }
      
      if (originalOnChange) {
        originalOnChange(e);
      }
    };

    inputProps.onChange = handleOnChange;

    return (
      <input
        ref={ref}
        type={type === "tel" || isPhone ? "tel" : type}
        data-slot="input"
        className={cn(
          "flex h-10 w-full  rounded-md border border-input bg-background px-3 py-1 text-slate-700 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-sm placeholder:font-normal",
          "aria-invalid:border-red-500 aria-invalid:focus-visible:ring-red-500 ",
          className
        )}
        {...inputProps}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

