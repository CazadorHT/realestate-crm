"use client";

import * as React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { getProvinceName, getDistrictName, getSubdistrictName } from "@/lib/utils/provinces";

interface AddressSelectorFieldProps {
  control: any;
  name: "province" | "district" | "subdistrict";
  label: string;
  icon: React.ComponentType<any>;
  placeholder: string;
  description: string;
  disabled?: boolean;
  options: any[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isMobileOrTablet: boolean;
  onSelect: (option: any) => void;
  formatOptionName?: (name: string) => string;
  loading?: boolean;
}

export function AddressSelectorField({
  control,
  name,
  label,
  icon: Icon,
  placeholder,
  description,
  disabled = false,
  options,
  isOpen,
  setIsOpen,
  searchQuery,
  setSearchQuery,
  isMobileOrTablet,
  onSelect,
  formatOptionName = (n) => n,
  loading = false,
}: AddressSelectorFieldProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const getDisplayName = React.useCallback(
    (opt: any) => {
      if (!opt) return "";
      const rawName = typeof opt === "string" ? opt : opt.name_th || opt.name_en || "";
      if (!isEn) return formatOptionName(rawName);

      if (opt.name_en && opt.name_en.trim() !== "") {
        return opt.name_en;
      }
      if (name === "province") {
        return getProvinceName(rawName, "en");
      }
      if (name === "subdistrict") {
        return getSubdistrictName(rawName, "en");
      }
      return getDistrictName(rawName, "en");
    },
    [isEn, formatOptionName, name],
  );

  const cleanWord = React.useCallback((val: string) => {
    if (!val) return "";
    return val.replace(/^(จังหวัด|เขต|อำเภอ|แขวง|ตำบล)/, "").trim().toLowerCase();
  }, []);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const val = field.value || "";
        const cleanVal = cleanWord(val);

        const exists = options.some(
          (opt) =>
            cleanWord(opt.name_th) === cleanVal ||
            cleanWord(formatOptionName(opt.name_th)) === cleanVal,
        );

        const effectiveOptions = !exists && val.trim()
          ? [
              {
                id: `custom-${val}`,
                name_th: val,
                name_en: isEn ? getSubdistrictName(val, "en") : val,
                zip_code: "",
              },
              ...options,
            ]
          : options;

        const q = searchQuery.trim().toLowerCase();
        const filteredOptions = !q
          ? effectiveOptions
          : effectiveOptions.filter(
              (opt) =>
                opt.name_th?.toLowerCase().includes(q) ||
                opt.name_en?.toLowerCase().includes(q) ||
                getDisplayName(opt).toLowerCase().includes(q),
            );

        const selectedOption = effectiveOptions.find((o) => o.name_th === val || o.name_en === val);
        const displaySelectedValue = selectedOption
          ? getDisplayName(selectedOption)
          : (val ? (isEn ? (name === "subdistrict" ? getSubdistrictName(val, "en") : getDistrictName(val, "en")) : val) : "");

        return (
          <FormItem className="col-span-1">
            <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
              <Icon className="h-3.5 w-3.5 text-blue-500" />
              <span>
                {label} <span className="text-red-500">*</span>
              </span>
              {loading && (
                <span className="inline-block animate-pulse text-slate-400 text-[10px]">...</span>
              )}
            </FormLabel>
            {isMobileOrTablet ? (
              <ResponsiveDialog
                open={isOpen}
                onOpenChange={(open) => {
                  setIsOpen(open);
                  if (!open) setSearchQuery("");
                }}
                title={isEn ? `Select ${label}` : `เลือก${label}`}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs justify-start text-left text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{displaySelectedValue || placeholder}</span>
                  </Button>
                }
              >
                <div className="flex flex-col h-full max-h-[70vh] bg-white">
                  {effectiveOptions.length > 0 && (
                    <div className="flex items-center border-b border-slate-100 px-4 py-2 shrink-0 bg-white">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isEn ? `Search ${label}...` : `ค้นหา${label}...`}
                        className="h-10 w-full border-0 bg-transparent pr-2 placeholder:text-sm text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}
                  <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-slate-50/30">
                    {effectiveOptions.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white border border-slate-100 rounded-xl">
                        {isEn ? "Please select the previous location first" : "กรุณาเลือกข้อมูลก่อนหน้า"}
                      </div>
                    ) : filteredOptions.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium bg-white border border-slate-100 rounded-xl">
                        {isEn ? `No ${label} found` : `ไม่พบ${label}ที่คุณค้นหา`}
                      </div>
                    ) : (
                      [...filteredOptions]
                        .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), isEn ? "en" : "th"))
                        .map((opt) => {
                          const isSelected = field.value === opt.name_th;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                onSelect(opt);
                                setIsOpen(false);
                                setSearchQuery("");
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                isSelected
                                  ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                  : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                              )}
                            >
                              <span className="text-xs font-bold">
                                {getDisplayName(opt)}
                              </span>
                              {isSelected && (
                                <div className="bg-blue-600 rounded-full p-1 text-white">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              </ResponsiveDialog>
            ) : (
              <Select
                key={`${name}-${disabled ? "disabled" : "enabled"}`}
                value={field.value ?? ""}
                disabled={disabled}
                onValueChange={(val) => {
                  const opt = effectiveOptions.find((o) => o.name_th === val);
                  if (opt) {
                    onSelect(opt);
                  } else {
                    field.onChange(val);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full h-11 rounded-lg bg-slate-50 border-slate-200 font-medium px-4 shadow-sm text-xs focus:ring-0">
                    <span className="truncate">
                      {displaySelectedValue || <span className="text-slate-400 font-normal">{placeholder}</span>}
                    </span>
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-75 min-w-50 bg-white rounded-xl shadow-lg border border-slate-100 p-1">
                  {[...effectiveOptions]
                    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), isEn ? "en" : "th"))
                    .map((opt) => (
                      <SelectItem key={opt.id} value={opt.name_th} className="rounded-lg cursor-pointer">
                        {getDisplayName(opt)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            {fieldState.error ? (
              <FormMessage className="text-[9px] sm:text-[10px] text-red-500 mt-1 min-h-8" />
            ) : (
              <FormDescription className="text-[9px] sm:text-[10px] text-slate-500 mt-1 min-h-8">
                {description}
              </FormDescription>
            )}
          </FormItem>
        );
      }}
    />
  );
}
