"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

/**
 * Formatted Price Input with commas and "บาท" suffix
 */
export function PriceInput({
  value,
  onChange,
  placeholder = "0",
  className,
}: {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value !== undefined && value !== null && value !== 0) {
      setDisplayValue(new Intl.NumberFormat("th-TH").format(value));
    } else if (value === 0) {
      setDisplayValue("0");
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }
    if (/^\d*$/.test(raw)) {
      const num = Number(raw);
      setDisplayValue(new Intl.NumberFormat("th-TH").format(num));
      onChange(num);
    }
  };

  return (
    <div className={`relative ${className || ""}`}>
      <Input
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className="pr-12"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
        บาท
      </span>
    </div>
  );
}
