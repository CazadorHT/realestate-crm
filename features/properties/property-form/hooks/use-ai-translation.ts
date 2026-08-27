"use client";

import { useState } from "react";
import { UseFormReturn, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { PropertyFormValues } from "@/features/properties/schema";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { useLanguage } from "@/components/providers/LanguageProvider";

const isNonEmptyString = (val: any): boolean => {
  return typeof val === "string" && val.trim() !== "" && val !== "<p></p>";
};

export type TranslateOptions = {
  silent?: boolean;
  forceAll?: boolean;
  targetLanguages?: ("th" | "en" | "cn" | "ru")[];
  sourceLang?: "th" | "en" | "cn" | "ru";
};

export function useAITranslation(formOverride?: UseFormReturn<PropertyFormValues>) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const formContext = useFormContext<PropertyFormValues>();
  const form = formOverride || formContext;

  if (!form) {
    throw new Error("useAITranslation must be used within a FormProvider or passed a form instance");
  }
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  // 1. Translate Title (Smart auto-detect source & selective target translation)
  const translateTitle = async (
    optionsOrSilent: boolean | TranslateOptions = false,
    forceLegacy = false
  ) => {
    const opts: TranslateOptions =
      typeof optionsOrSilent === "object"
        ? optionsOrSilent
        : { silent: optionsOrSilent, forceAll: forceLegacy };

    const titleTh = form.getValues("title");
    const currentEn = form.getValues("title_en");
    const currentCn = form.getValues("title_cn");
    const currentRu = form.getValues("title_ru");

    const hasTh = isNonEmptyString(titleTh);
    const hasEn = isNonEmptyString(currentEn);
    const hasCn = isNonEmptyString(currentCn);
    const hasRu = isNonEmptyString(currentRu);

    let sourceText = "";
    let detectedSourceLang: "th" | "en" | "cn" | "ru" = "th";

    if (opts.sourceLang === "en" && hasEn) {
      sourceText = currentEn!;
      detectedSourceLang = "en";
    } else if (opts.sourceLang === "cn" && hasCn) {
      sourceText = currentCn!;
      detectedSourceLang = "cn";
    } else if (opts.sourceLang === "ru" && hasRu) {
      sourceText = currentRu!;
      detectedSourceLang = "ru";
    } else if (hasTh) {
      sourceText = titleTh!;
      detectedSourceLang = "th";
    } else if (hasEn) {
      sourceText = currentEn!;
      detectedSourceLang = "en";
    } else if (hasCn) {
      sourceText = currentCn!;
      detectedSourceLang = "cn";
    } else if (hasRu) {
      sourceText = currentRu!;
      detectedSourceLang = "ru";
    }

    if (!sourceText) {
      if (!opts.silent)
        toast.error(
          isEn
            ? "Please enter a title in any language before translating."
            : "กรุณากรอกชื่อทรัพย์ในช่องภาษาใดก็ได้ก่อนกดแปลครับ"
        );
      return false;
    }

    let targets: ("th" | "en" | "cn" | "ru")[] = [];

    if (opts.targetLanguages && opts.targetLanguages.length > 0) {
      targets = opts.targetLanguages.filter((l) => l !== detectedSourceLang);
    } else if (opts.forceAll) {
      targets = (["th", "en", "cn", "ru"] as const).filter((l) => l !== detectedSourceLang);
    } else {
      // Smart Fill Mode: Only translate to empty fields!
      targets = (["th", "en", "cn", "ru"] as const).filter((l) => {
        if (l === detectedSourceLang) return false;
        if (l === "th") return !hasTh;
        if (l === "en") return !hasEn;
        if (l === "cn") return !hasCn;
        if (l === "ru") return !hasRu;
        return false;
      });

      if (targets.length === 0) {
        if (!opts.silent)
          toast.info(
            isEn
              ? "All title languages are already filled ✨"
              : "ชื่อทรัพย์กรอกครบทุกภาษาแล้วครับ ✨"
          );
        return true;
      }
    }

    setIsTranslating(true);
    const targetNames = targets.map((t) => t.toUpperCase()).join(", ");
    const processId = !opts.silent
      ? startProcess(
          isEn
            ? `Translating title to ${targetNames}`
            : `แปลชื่อทรัพย์ไปยังภาษา (${targetNames})`,
          { type: "PROPERTY_TRANSLATION" }
        )
      : null;

    try {
      const result = await translateTextAction(sourceText, "plain", targets);
      if (targets.includes("th") && result.th) {
        form.setValue("title", result.th, { shouldDirty: true, shouldTouch: true });
      }
      if (targets.includes("en") && result.en) {
        form.setValue("title_en", result.en, { shouldDirty: true, shouldTouch: true });
      }
      if (targets.includes("cn") && result.cn) {
        form.setValue("title_cn", result.cn, { shouldDirty: true, shouldTouch: true });
      }
      if (targets.includes("ru") && result.ru) {
        form.setValue("title_ru", result.ru, { shouldDirty: true, shouldTouch: true });
      }

      if (processId)
        finishProcess(
          processId,
          "SUCCESS",
          isEn
            ? `Title translated to (${targetNames}) successfully ✨`
            : `แปลชื่อทรัพย์ (${targetNames}) เรียบร้อยแล้ว ✨`
        );
      if (!opts.silent && !processId) {
        toast.success(
          isEn
            ? `Title translated to (${targetNames}) ✨`
            : `แปลชื่อทรัพย์ (${targetNames}) เรียบร้อยแล้ว ✨`
        );
      }
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : isEn ? "Translation failed" : "การแปลขัดข้อง";
      if (processId) finishProcess(processId, "ERROR", msg);
      if (!opts.silent) toast.error(msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 2. Translate Description (Smart auto-detect source & selective target translation)
  const translateDescription = async (
    optionsOrSilent: boolean | TranslateOptions = false,
    forceLegacy = false
  ) => {
    const opts: TranslateOptions =
      typeof optionsOrSilent === "object"
        ? optionsOrSilent
        : { silent: optionsOrSilent, forceAll: forceLegacy };

    const descTh = form.getValues("description");
    const currentEn = form.getValues("description_en");
    const currentCn = form.getValues("description_cn");
    const currentRu = form.getValues("description_ru");

    const hasTh = isNonEmptyString(descTh);
    const hasEn = isNonEmptyString(currentEn);
    const hasCn = isNonEmptyString(currentCn);
    const hasRu = isNonEmptyString(currentRu);

    let sourceText = "";
    let detectedSourceLang: "th" | "en" | "cn" | "ru" = "th";

    if (opts.sourceLang === "en" && hasEn) {
      sourceText = currentEn!;
      detectedSourceLang = "en";
    } else if (opts.sourceLang === "cn" && hasCn) {
      sourceText = currentCn!;
      detectedSourceLang = "cn";
    } else if (opts.sourceLang === "ru" && hasRu) {
      sourceText = currentRu!;
      detectedSourceLang = "ru";
    } else if (hasTh) {
      sourceText = descTh!;
      detectedSourceLang = "th";
    } else if (hasEn) {
      sourceText = currentEn!;
      detectedSourceLang = "en";
    } else if (hasCn) {
      sourceText = currentCn!;
      detectedSourceLang = "cn";
    } else if (hasRu) {
      sourceText = currentRu!;
      detectedSourceLang = "ru";
    }

    if (!sourceText) {
      if (!opts.silent)
        toast.error(
          isEn
            ? "Please enter a description in any language before translating."
            : "กรุณากรอกคำบรรยายในช่องภาษาใดก็ได้ก่อนกดแปลครับ"
        );
      return false;
    }

    let targets: ("th" | "en" | "cn" | "ru")[] = [];

    if (opts.targetLanguages && opts.targetLanguages.length > 0) {
      targets = opts.targetLanguages.filter((l) => l !== detectedSourceLang);
    } else if (opts.forceAll) {
      targets = (["th", "en", "cn", "ru"] as const).filter((l) => l !== detectedSourceLang);
    } else {
      // Smart Fill Mode: Only translate to empty fields!
      targets = (["th", "en", "cn", "ru"] as const).filter((l) => {
        if (l === detectedSourceLang) return false;
        if (l === "th") return !hasTh;
        if (l === "en") return !hasEn;
        if (l === "cn") return !hasCn;
        if (l === "ru") return !hasRu;
        return false;
      });

      if (targets.length === 0) {
        if (!opts.silent)
          toast.info(
            isEn
              ? "All description languages are already filled ✨"
              : "คำบรรยายกรอกครบทุกภาษาแล้วครับ ✨"
          );
        return true;
      }
    }

    setIsTranslating(true);
    const targetNames = targets.map((t) => t.toUpperCase()).join(", ");
    const processId = !opts.silent
      ? startProcess(
          isEn
            ? `Translating description to ${targetNames}`
            : `แปลคำบรรยายไปยังภาษา (${targetNames})`,
          { type: "PROPERTY_TRANSLATION" }
        )
      : null;

    try {
      const result = await translateTextAction(sourceText, "html", targets);
      if (targets.includes("th") && result.th) {
        form.setValue("description", result.th, { shouldDirty: true, shouldTouch: true });
      }
      if (targets.includes("en") && result.en) {
        form.setValue("description_en", result.en, { shouldDirty: true, shouldTouch: true });
      }
      if (targets.includes("cn") && result.cn) {
        form.setValue("description_cn", result.cn, { shouldDirty: true, shouldTouch: true });
      }
      if (targets.includes("ru") && result.ru) {
        form.setValue("description_ru", result.ru, { shouldDirty: true, shouldTouch: true });
      }

      if (processId)
        finishProcess(
          processId,
          "SUCCESS",
          isEn
            ? `Description translated to (${targetNames}) successfully ✨`
            : `แปลคำบรรยาย (${targetNames}) เรียบร้อยแล้ว ✨`
        );
      if (!opts.silent && !processId) {
        toast.success(
          isEn
            ? `Description translated to (${targetNames}) ✨`
            : `แปลคำบรรยาย (${targetNames}) เรียบร้อยแล้ว ✨`
        );
      }
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : isEn ? "Translation failed" : "การแปลขัดข้อง";
      if (processId) finishProcess(processId, "ERROR", msg);
      if (!opts.silent) toast.error(msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 2b. Generate Description (New)
  const generateDescription = async (silent = false) => {
    const values = form.getValues();
    const currentDesc = form.getValues("description");
    const processId = !silent
      ? startProcess(
          currentDesc && currentDesc.trim() !== "" && currentDesc !== "<p></p>"
            ? (isEn ? "AI is refining description..." : "AI กำลังนำคำบรรยายเดิมมาเกลาใหม่...")
            : (isEn ? "AI is drafting property description..." : "AI กำลังแต่งคำบรรยายทรัพย์..."),
          {
            type: "PROPERTY_TRANSLATION",
          }
        )
      : null;

    setIsTranslating(true);
    try {
      const { generateAIPropertyDescriptionAction } = await import(
        "../actions/ai-actions"
      );
      const html = await generateAIPropertyDescriptionAction(
        values,
        currentDesc && currentDesc.trim() !== "" && currentDesc !== "<p></p>" ? currentDesc : undefined
      );

      form.setValue("description", html, {
        shouldDirty: true,
        shouldTouch: true,
      });

      if (processId)
        finishProcess(
          processId,
          "SUCCESS",
          currentDesc && currentDesc.trim() !== "" && currentDesc !== "<p></p>"
            ? (isEn ? "Refined description successfully ✨" : "เกลาคำบรรยายภาษาไทยเรียบร้อย ✨")
            : (isEn ? "Generated description successfully ✨" : "แต่งคำบรรยายภาษาไทยเรียบร้อย ✨")
        );
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (isEn ? "Description generation failed" : "การแต่งคำบรรยายขัดข้อง");
      if (processId) finishProcess(processId, "ERROR", msg);
      if (!silent) toast.error(msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. Translate Transits (Batch)
  const translateTransits = async (silent = false, force = false) => {
    let transits = form.getValues("nearby_transits") || [];
    if (typeof transits === "string") {
      try {
        transits = JSON.parse(transits);
      } catch (e) {
        transits = [];
      }
    }
    if (!Array.isArray(transits)) {
      transits = [];
    }
    // Filter to ensure only valid objects are kept
    transits = transits.filter((t: any) => t && typeof t === "object");
    if (transits.length === 0) return;

    const needsTranslation = transits.filter(
      (t: any) => t.station_name && (force || !isNonEmptyString(t.station_name_en) || !isNonEmptyString(t.station_name_cn) || !isNonEmptyString(t.station_name_ru)),
    );
    if (!force && needsTranslation.length === 0) {
      if (!silent) toast.success(isEn ? "Transit info translated completely ✨" : "ข้อมูลสถานีรถไฟฟ้าแปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    try {
      const { translatePlaceNamesAction } =
        await import("../actions/ai-actions");
      const namesToTranslate = needsTranslation.map((t: any) => t.station_name);
      const results = await translatePlaceNamesAction(namesToTranslate);

      // Update form values
      const updatedTransits = transits.map((t: any) => {
        if (!t || typeof t !== "object") return t;
        const idx = needsTranslation.findIndex((nt: any) => nt === t);
        if (idx !== -1 && results[idx]) {
          return {
            ...t,
            station_name_en: (!force && isNonEmptyString(t.station_name_en)) ? t.station_name_en : (results[idx].name_en || t.station_name_en),
            station_name_cn: (!force && isNonEmptyString(t.station_name_cn)) ? t.station_name_cn : (results[idx].name_cn || t.station_name_cn),
            station_name_ru: (!force && isNonEmptyString(t.station_name_ru)) ? t.station_name_ru : (results[idx].name_ru || t.station_name_ru),
          };
        }
        return t;
      });

      form.setValue("nearby_transits", updatedTransits, { shouldDirty: true });
      if (!silent)
        toast.success(
          isEn
            ? `Translated ${results.length} transit stations ✨`
            : `แปลข้อมูลสถานีรถไฟฟ้าเรียบร้อยแล้ว ${results.length} รายการ ✨`,
        );
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error) {
      if (!silent) toast.error(isEn ? "Transit translation failed" : "การแปลสถานีรถไฟฟ้าขัดข้อง");
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 4. Translate Nearby Places (Batch)
  const translatePlaces = async (silent = false, force = false) => {
    let places = form.getValues("nearby_places") || [];
    if (typeof places === "string") {
      try {
        places = JSON.parse(places);
      } catch (e) {
        places = [];
      }
    }
    if (!Array.isArray(places)) {
      places = [];
    }
    // Filter to ensure only valid objects are kept
    places = places.filter((p: any) => p && typeof p === "object");
    if (places.length === 0) return;

    const needsTranslation = places.filter(
      (p: any) => p.name && (force || !isNonEmptyString(p.name_en) || !isNonEmptyString(p.name_cn) || !isNonEmptyString(p.name_ru)),
    );
    if (!force && needsTranslation.length === 0) {
      if (!silent) toast.success(isEn ? "Nearby places translated completely ✨" : "ข้อมูลสถานที่ใกล้เคียงแปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    try {
      const { translatePlaceNamesAction } =
        await import("../actions/ai-actions");
      const namesToTranslate = needsTranslation.map((p: any) => p.name);
      const results = await translatePlaceNamesAction(namesToTranslate);

      const updatedPlaces = places.map((p: any) => {
        if (!p || typeof p !== "object") return p;
        const idx = needsTranslation.findIndex((np: any) => np === p);
        if (idx !== -1 && results[idx]) {
          return {
            ...p,
            name_en: (!force && isNonEmptyString(p.name_en)) ? p.name_en : (results[idx].name_en || p.name_en),
            name_cn: (!force && isNonEmptyString(p.name_cn)) ? p.name_cn : (results[idx].name_cn || p.name_cn),
            name_ru: (!force && isNonEmptyString(p.name_ru)) ? p.name_ru : (results[idx].name_ru || p.name_ru),
          };
        }
        return p;
      });

      form.setValue("nearby_places", updatedPlaces, { shouldDirty: true });
      if (!silent)
        toast.success(
          isEn
            ? `Translated ${results.length} nearby places ✨`
            : `แปลข้อมูลสถานที่ใกล้เคียงเรียบร้อยแล้ว ${results.length} รายการ ✨`,
        );
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error) {
      if (!silent) toast.error(isEn ? "Nearby place translation failed" : "การแปลสถานที่ใกล้เคียงขัดข้อง");
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 4b. Translate Address
  const translateAddress = async (silent = false, force = false) => {
    const address = form.getValues("address_line1");
    if (typeof address !== "string" || !address.trim()) {
      if (!silent) toast.error(isEn ? "Please enter an address before translating." : "กรุณากรอกที่อยู่ภาษาไทยก่อนกดแปลครับ");
      return;
    }

    const currentEn = form.getValues("address_line1_en");
    const currentCn = form.getValues("address_line1_cn");
    const currentRu = form.getValues("address_line1_ru");

    const hasEn = isNonEmptyString(currentEn);
    const hasCn = isNonEmptyString(currentCn);
    const hasRu = isNonEmptyString(currentRu);

    if (!force && hasEn && hasCn && hasRu) {
      if (!silent) toast.success(isEn ? "Address translated completely ✨" : "ที่อยู่แปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    const processId = !silent ? startProcess(isEn ? "Translating address" : "แปลที่อยู่ทรัพย์", { type: "PROPERTY_TRANSLATION" }) : null;

    try {
      const result = await translateTextAction(address, "plain");
      if (force || !hasEn) {
        form.setValue("address_line1_en", result.en, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      if (force || !hasCn) {
        form.setValue("address_line1_cn", result.cn, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      if (force || !hasRu) {
        form.setValue("address_line1_ru", result.ru, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      if (processId) finishProcess(processId, "SUCCESS", isEn ? "Address translated successfully ✨" : "แปลที่อยู่เรียบร้อยแล้ว ✨");
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (isEn ? "Address translation failed" : "การแปลขัดข้อง");
      if (processId) finishProcess(processId, "ERROR", msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 4c. Translate Popular Area
  const translatePopularArea = async (silent = false, force = false) => {
    const area = form.getValues("popular_area");
    if (typeof area !== "string" || !area.trim()) return;

    const currentEn = form.getValues("popular_area_en");
    const currentCn = form.getValues("popular_area_cn");
    const currentRu = form.getValues("popular_area_ru");

    const hasEn = isNonEmptyString(currentEn);
    const hasCn = isNonEmptyString(currentCn);
    const hasRu = isNonEmptyString(currentRu);

    if (!force && hasEn && hasCn && hasRu) return;

    setIsTranslating(true);
    try {
      const result = await translateTextAction(area, "plain");
      if (force || !hasEn) form.setValue("popular_area_en", result.en, { shouldDirty: true });
      if (force || !hasCn) form.setValue("popular_area_cn", result.cn, { shouldDirty: true });
      if (force || !hasRu) form.setValue("popular_area_ru", result.ru, { shouldDirty: true });
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  const translateAll = async () => {
    setIsTranslatingAll(true);
    const processId = startProcess(
      isEn ? "Translating all property details (AI Auto-Translate)" : "แปลข้อมูลทรัพย์สินทั้งหมด (AI Auto-Translate)",
      {
        type: "PROPERTY_TRANSLATION",
        onRetry: translateAll,
      },
    );

    try {
      finishProcess(processId, "PROCESSING", isEn ? "Starting multi-field translation..." : "กำลังเริ่มแปลข้อมูลทุกส่วน...");

      // Run sequentially with force = false to protect already translated fields
      await translateTitle(true, false);
      await translateDescription(true, false);
      await translateAddress(true, false);
      await translatePopularArea(true, false);
      await translateTransits(true, false);
      await translatePlaces(true, false);

      finishProcess(processId, "SUCCESS", isEn ? "All property fields translated successfully! ✨" : "แปลข้อมูลครบทุกส่วนเรียบร้อยแล้ว! ✨");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (isEn ? "Translation failed" : "การแปลขัดข้อง");
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const generateAndTranslateAll = async () => {
    setIsTranslatingAll(true);
    const processId = startProcess(isEn ? "AI Writer: Generating descriptions in all languages..." : "AI Writer: กำลังแต่งคำบรรยายทุกภาษา...", {
      type: "PROPERTY_TRANSLATION",
      onRetry: generateAndTranslateAll,
    });

    try {
      finishProcess(processId, "PROCESSING", isEn ? "Starting description generation..." : "กำลังเริ่มแต่งคำบรรยาย...");
      // 1. Generate TH
      const success = await generateDescription(true);
      if (!success) throw new Error(isEn ? "Failed to draft description" : "ไม่สามารถแต่งคำบรรยายภาษาไทยได้");

      // 2. Translate to others
      finishProcess(
        processId,
        "PROCESSING",
        isEn ? "Draft generated. Translating to other languages..." : "แต่งภาษาไทยสำเร็จ กำลังแปลเป็นภาษาอื่น...",
      );
      await translateDescription(true);

      finishProcess(
        processId,
        "SUCCESS",
        isEn ? "Descriptions generated and translated in all languages! ✨" : "แต่งคำบรรยายครบทุกภาษาเรียบร้อยแล้ว! ✨",
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (isEn ? "Operation failed" : "การทำงานขัดข้อง");
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  return {
    isTranslating,
    isTranslatingAll,
    translateTitle,
    translateDescription,
    translateTransits,
    translatePlaces,
    translateAddress,
    translateAll,
    generateDescription,
    generateAndTranslateAll,
  };
}
