import React from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { NumberInput } from "./NumberInput"; // Assuming same directory or adjust import

export function UnitNumberField({
  label,
  name,
  control,
  placeholder,
  suffix,
  className,
  labelClassName,
  decimals,
  disabled,
  labelHint,
  description,
  emphasize,
  required,
  size = "default",
  maxLength,
  action,
}: {
  label: string | React.ReactNode;
  name: any;
  control: any;
  placeholder?: string;
  suffix: string;
  className?: string;
  labelClassName?: string;
  decimals?: number;
  disabled?: boolean;
  labelHint?: React.ReactNode;
  description?: string;
  emphasize?: boolean;
  required?: boolean;
  size?: "default" | "sm";
  maxLength?: number;
  action?: React.ReactNode;
}) {
  const isSmall = size === "sm";
  const heightClass = isSmall ? "h-9" : "h-11";
  const roundLeft = isSmall ? "rounded-l-lg" : "rounded-l-xl";
  const roundRight = isSmall ? "rounded-r-lg" : "rounded-r-xl";
  const textSize = isSmall ? "text-sm" : "text-base";

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel
            className={[
              labelClassName ??
                `flex items-center justify-between gap-3 font-medium ${
                  isSmall ? "text-xs" : "text-sm"
                }`,
              fieldState.error ? "text-red-600" : "text-slate-600",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2">
              {label}
              {required && <span className="text-red-500">*</span>}
              {labelHint}
            </span>
            {fieldState.error ? (
              <span className="text-xs font-medium text-rose-600">
                {fieldState.error.message}
              </span>
            ) : action ? (
              <div className="font-normal text-slate-500">{action}</div>
            ) : null}
          </FormLabel>

          {description ? (
            <FormDescription
              className={
                fieldState.error
                  ? "text-red-500 text-xs"
                  : "text-xs text-slate-500"
              }
            >
              {fieldState.error ? "กรุณากรอกข้อมูลนี้" : description}
            </FormDescription>
          ) : null}
          {/*  แก้ไข Input ได้ที่นี้  */}
          <FormControl>
            <div
              className={[
                "flex items-center",
                fieldState.error
                  ? `ring-2 ring-red-400 ${
                      isSmall ? "rounded-lg" : "rounded-xl"
                    }`
                  : "",
              ].join(" ")}
            >
              <NumberInput
                {...field}
                decimals={decimals}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                className={[
                  `${heightClass} w-full ${roundLeft} rounded-r-none border-r-0 bg-white`,
                  fieldState.error ? "border-red-400" : "border-slate-200",
                  "focus:border-slate-900 focus:ring-0",
                  "text-slate-900 align-middle",
                  emphasize ? `font-medium ${textSize}` : "font-medium",
                  disabled ? "bg-slate-50 text-slate-500" : "",
                  className ?? "",
                ].join(" ")}
              />
              <span
                className={[
                  `${heightClass} flex items-center select-none whitespace-nowrap ${roundRight} border border-l-0`,
                  fieldState.error
                    ? "border-red-400 bg-red-50"
                    : "border-slate-200 bg-slate-50",
                  "px-3",
                  disabled ? "text-slate-400" : "",
                  emphasize
                    ? `font-medium text-xs text-slate-600`
                    : "font-medium text-sm text-slate-600",
                ].join(" ")}
              >
                {suffix}
              </span>
            </div>
          </FormControl>

          {/* keep FormMessage to align RHF errors if you prefer default rendering */}
          <FormMessage className="hidden" />
        </FormItem>
      )}
    />
  );
}
