"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface NumberInputProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  ariaInvalid?: boolean;
  decimals?: number;
  allowNegative?: boolean;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

/**
 * Pure controlled numeric input component with comma formatting.
 * NOT tied to React Hook Form - wrap with FormField in parent components.
 */
export function NumberInput({
  value,
  onChange,
  placeholder,
  ariaInvalid,
  decimals = 0,
  allowNegative = false,
  className,
  disabled,
  maxLength,
}: NumberInputProps) {
  const formatNumber = (val: number | undefined, decimals = 0) =>
    val == null
      ? ""
      : new Intl.NumberFormat(undefined, {
          maximumFractionDigits: decimals,
          minimumFractionDigits: 0,
        }).format(val);

  const parseNumber = (s: string) => {
    const cleaned = s.replace(/[^0-9.-]/g, "");
    return cleaned === "" ? undefined : Number(cleaned);
  };

  const [display, setDisplay] = React.useState<string>(() =>
    formatNumber(value, decimals),
  );
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const commitTimer = React.useRef<number | null>(null);

  // Only update display from value when input is NOT focused
  React.useEffect(() => {
    if (!isFocused) {
      setDisplay(formatNumber(value, decimals));
    }
  }, [value, decimals, isFocused]);

  // Clear any pending timer on unmount
  React.useEffect(() => {
    return () => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current);
    };
  }, []);

  const commitValue = (raw: string) => {
    const parsed = parseNumber(raw);
    // Only call onChange if value actually changes
    if (
      (parsed === undefined && value === undefined) ||
      (parsed != null && parsed === value)
    ) {
      return;
    }
    onChange(parsed);
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={display}
      aria-invalid={ariaInvalid}
      className={className}
      disabled={disabled}
      onFocus={() => {
        setIsFocused(true);
        setDisplay(value == null ? "" : String(value));
        // Move caret to end
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (el) el.selectionStart = el.selectionEnd = el.value.length;
        });
      }}
      onChange={(e) => {
        const val = e.target.value;
        setDisplay(val);

        // Debounce committing
        if (commitTimer.current) window.clearTimeout(commitTimer.current);
        commitTimer.current = window.setTimeout(() => {
          commitValue(val);
          commitTimer.current = null;
        }, 1000);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        // Commit immediately on blur
        if (commitTimer.current) window.clearTimeout(commitTimer.current);
        const parsed = parseNumber(e.target.value);
        if (
          (parsed === undefined && value !== undefined) ||
          (parsed != null && parsed !== value)
        ) {
          onChange(parsed);
        }
        setDisplay(formatNumber(parsed, decimals));
      }}
      onKeyDown={(e) => {
        // Block non-numeric characters from being typed
        const allowedKeys = [
          "Backspace",
          "Delete",
          "Tab",
          "Escape",
          "Enter",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
        ];

        // Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
        if (
          (e.ctrlKey || e.metaKey) &&
          ["a", "c", "v", "x"].includes(e.key.toLowerCase())
        ) {
          return;
        }

        // Allow: navigation and editing keys
        if (allowedKeys.includes(e.key)) {
          // Handle Enter key - commit value
          if (e.key === "Enter") {
            if (commitTimer.current) window.clearTimeout(commitTimer.current);
            const parsed = parseNumber((e.target as HTMLInputElement).value);
            if (
              (parsed === undefined && value !== undefined) ||
              (parsed != null && parsed !== value)
            ) {
              onChange(parsed);
            }
            (e.target as HTMLInputElement).blur();
          }
          return;
        }

        // Allow: numbers 0-9
        if (/^[0-9]$/.test(e.key)) {
          return;
        }

        // Allow: decimal point (.) if decimals > 0 and not already present
        if (decimals > 0 && e.key === ".") {
          const currentValue = (e.target as HTMLInputElement).value;
          if (!currentValue.includes(".")) {
            return;
          }
        }

        // Allow: minus sign (-) if allowNegative and at start
        if (allowNegative && e.key === "-") {
          const el = e.target as HTMLInputElement;
          if (el.selectionStart === 0 && !el.value.includes("-")) {
            return;
          }
        }

        // Block everything else
        e.preventDefault();
      }}
      maxLength={maxLength}
      placeholder={placeholder}
    />
  );
}
