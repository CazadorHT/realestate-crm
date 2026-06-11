"use client";

import { useState } from "react";
import { UseFormReturn, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { PropertyFormValues } from "@/features/properties/schema";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { startProcess, finishProcess } from "@/lib/process-monitor";

const isNonEmptyString = (val: any): boolean => {
  return typeof val === "string" && val.trim() !== "" && val !== "<p></p>";
};

export function useAITranslation(formOverride?: UseFormReturn<PropertyFormValues>) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formOverride || formContext;

  if (!form) {
    throw new Error("useAITranslation must be used within a FormProvider or passed a form instance");
  }
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  // 1. Translate Title
  const translateTitle = async (silent = false) => {
    const title = form.getValues("title");
    if (typeof title !== "string" || !title.trim()) {
      if (!silent) toast.error("กรุณากรอกชื่อภาษาไทยก่อนกดแปลครับ");
      return;
    }

    const hasEn = isNonEmptyString(form.getValues("title_en"));
    const hasCn = isNonEmptyString(form.getValues("title_cn"));
    const hasRu = isNonEmptyString(form.getValues("title_ru"));
    if (hasEn && hasCn && hasRu) {
      if (!silent) toast.success("ชื่อทรัพย์แปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    const processId = !silent ? startProcess(`แปลชื่อทรัพย์: ${title}`, { type: "PROPERTY_TRANSLATION" }) : null;

    try {
      const result = await translateTextAction(title, "plain");
      form.setValue("title_en", result.en, {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("title_cn", result.cn, {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("title_ru", result.ru, {
        shouldDirty: true,
        shouldTouch: true,
      });
      if (processId) finishProcess(processId, "SUCCESS", "แปลชื่อทรัพย์เรียบร้อยแล้ว ✨");
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "การแปลขัดข้อง";
      if (processId) finishProcess(processId, "ERROR", msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 2. Translate Description
  const translateDescription = async (silent = false) => {
    const desc = form.getValues("description");
    if (typeof desc !== "string" || desc.trim() === "" || desc === "<p></p>") {
      if (!silent) toast.error("กรุณากรอกคำบรรยายภาษาไทยก่อนกดแปลครับ");
      return;
    }

    const hasEn = isNonEmptyString(form.getValues("description_en"));
    const hasCn = isNonEmptyString(form.getValues("description_cn"));
    const hasRu = isNonEmptyString(form.getValues("description_ru"));
    if (hasEn && hasCn && hasRu) {
      if (!silent) toast.success("คำบรรยายแปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    const processId = !silent
      ? startProcess("แปลคำบรรยายทรัพย์ (HTML)", {
          type: "PROPERTY_TRANSLATION",
        })
      : null;

    try {
      const result = await translateTextAction(desc, "html");
      form.setValue("description_en", result.en, {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("description_cn", result.cn, {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("description_ru", result.ru, {
        shouldDirty: true,
        shouldTouch: true,
      });
      if (processId)
        finishProcess(processId, "SUCCESS", "แปลคำบรรยายเรียบร้อยแล้ว ✨");
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "การแปลขัดข้อง";
      if (processId) finishProcess(processId, "ERROR", msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 2b. Generate Description (New)
  const generateDescription = async (silent = false) => {
    const values = form.getValues();
    const processId = !silent
      ? startProcess("AI กำลังแต่งคำบรรยายทรัพย์...", {
          type: "PROPERTY_TRANSLATION",
        })
      : null;

    setIsTranslating(true);
    try {
      const { generateAIPropertyDescriptionAction } = await import(
        "../actions/ai-actions"
      );
      const html = await generateAIPropertyDescriptionAction(values);

      form.setValue("description", html, {
        shouldDirty: true,
        shouldTouch: true,
      });

      if (processId)
        finishProcess(processId, "SUCCESS", "แต่งคำบรรยายภาษาไทยเรียบร้อย ✨");
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "การแต่งคำบรรยายขัดข้อง";
      if (processId) finishProcess(processId, "ERROR", msg);
      if (!silent) toast.error(msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. Translate Transits (Batch)
  const translateTransits = async (silent = false) => {
    const transits = form.getValues("nearby_transits") || [];
    if (transits.length === 0) return;

    const needsTranslation = transits.filter(
      (t: any) => t.station_name && (!t.station_name_en || !t.station_name_cn || !t.station_name_ru),
    );
    if (needsTranslation.length === 0) {
      if (!silent) toast.success("ข้อมูลสถานีรถไฟฟ้าแปลครบถ้วนแล้ว ✨");
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
        const idx = needsTranslation.findIndex((nt: any) => nt === t);
        if (idx !== -1 && results[idx]) {
          return {
            ...t,
            station_name_en: t.station_name_en || results[idx].name_en,
            station_name_cn: t.station_name_cn || results[idx].name_cn,
            station_name_ru: t.station_name_ru || results[idx].name_ru,
          };
        }
        return t;
      });

      form.setValue("nearby_transits", updatedTransits, { shouldDirty: true });
      if (!silent)
        toast.success(
          `แปลข้อมูลสถานีรถไฟฟ้าเรียบร้อยแล้ว ${results.length} รายการ ✨`,
        );
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error) {
      if (!silent) toast.error("การแปลสถานีรถไฟฟ้าขัดข้อง");
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 4. Translate Nearby Places (Batch)
  const translatePlaces = async (silent = false) => {
    const places = form.getValues("nearby_places") || [];
    if (places.length === 0) return;

    const needsTranslation = places.filter(
      (p: any) => p.name && (!p.name_en || !p.name_cn || !p.name_ru),
    );
    if (needsTranslation.length === 0) {
      if (!silent) toast.success("ข้อมูลสถานที่ใกล้เคียงแปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    try {
      const { translatePlaceNamesAction } =
        await import("../actions/ai-actions");
      const namesToTranslate = needsTranslation.map((p: any) => p.name);
      const results = await translatePlaceNamesAction(namesToTranslate);

      const updatedPlaces = places.map((p: any) => {
        const idx = needsTranslation.findIndex((np: any) => np === p);
        if (idx !== -1 && results[idx]) {
          return {
            ...p,
            name_en: p.name_en || results[idx].name_en,
            name_cn: p.name_cn || results[idx].name_cn,
            name_ru: p.name_ru || results[idx].name_ru,
          };
        }
        return p;
      });

      form.setValue("nearby_places", updatedPlaces, { shouldDirty: true });
      if (!silent)
        toast.success(
          `แปลข้อมูลสถานที่ใกล้เคียงเรียบร้อยแล้ว ${results.length} รายการ ✨`,
        );
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error) {
      if (!silent) toast.error("การแปลสถานที่ใกล้เคียงขัดข้อง");
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 4b. Translate Address
  const translateAddress = async (silent = false) => {
    const address = form.getValues("address_line1");
    if (typeof address !== "string" || !address.trim()) {
      if (!silent) toast.error("กรุณากรอกที่อยู่ภาษาไทยก่อนกดแปลครับ");
      return;
    }

    const hasEn = isNonEmptyString(form.getValues("address_line1_en"));
    const hasCn = isNonEmptyString(form.getValues("address_line1_cn"));
    const hasRu = isNonEmptyString(form.getValues("address_line1_ru"));
    if (hasEn && hasCn && hasRu) {
      if (!silent) toast.success("ที่อยู่แปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    const processId = !silent ? startProcess("แปลที่อยู่ทรัพย์", { type: "PROPERTY_TRANSLATION" }) : null;

    try {
      const result = await translateTextAction(address, "plain");
      form.setValue("address_line1_en", result.en, {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("address_line1_cn", result.cn, {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("address_line1_ru", result.ru, {
        shouldDirty: true,
        shouldTouch: true,
      });
      if (processId) finishProcess(processId, "SUCCESS", "แปลที่อยู่เรียบร้อยแล้ว ✨");
      form.setValue("requires_ai_review", true, { shouldDirty: true });
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "การแปลขัดข้อง";
      if (processId) finishProcess(processId, "ERROR", msg);
      return false;
    } finally {
      setIsTranslating(false);
    }
  };
  // 4c. Translate Popular Area
  const translatePopularArea = async (silent = false) => {
    const area = form.getValues("popular_area");
    if (typeof area !== "string" || !area.trim()) return;

    const hasEn = isNonEmptyString(form.getValues("popular_area_en"));
    const hasCn = isNonEmptyString(form.getValues("popular_area_cn"));
    const hasRu = isNonEmptyString(form.getValues("popular_area_ru"));
    if (hasEn && hasCn && hasRu) return;

    setIsTranslating(true);
    try {
      const result = await translateTextAction(area, "plain");
      form.setValue("popular_area_en", result.en, { shouldDirty: true });
      form.setValue("popular_area_cn", result.cn, { shouldDirty: true });
      form.setValue("popular_area_ru", result.ru, { shouldDirty: true });
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
      "แปลข้อมูลทรัพย์สินทั้งหมด (AI Auto-Translate)",
      {
        type: "PROPERTY_TRANSLATION",
        onRetry: translateAll,
      },
    );

    try {
      finishProcess(processId, "PROCESSING", "กำลังเริ่มแปลข้อมูลทุกส่วน...");
      await Promise.all([
        translateTitle(true),
        translateDescription(true),
        translateTransits(true),
        translatePlaces(true),
        translateAddress(true),
        translatePopularArea(true),
      ]);
      finishProcess(processId, "SUCCESS", "แปลข้อมูลครบทุกส่วนเรียบร้อยแล้ว! ✨");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "การแปลขัดข้อง";
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const generateAndTranslateAll = async () => {
    setIsTranslatingAll(true);
    const processId = startProcess("AI Writer: กำลังแต่งคำบรรยายทุกภาษา...", {
      type: "PROPERTY_TRANSLATION",
      onRetry: generateAndTranslateAll,
    });

    try {
      finishProcess(processId, "PROCESSING", "กำลังเริ่มแต่งคำบรรยาย...");
      // 1. Generate TH
      const success = await generateDescription(true);
      if (!success) throw new Error("ไม่สามารถแต่งคำบรรยายภาษาไทยได้");

      // 2. Translate to others
      finishProcess(
        processId,
        "PROCESSING",
        "แต่งภาษาไทยสำเร็จ กำลังแปลเป็นภาษาอื่น...",
      );
      await translateDescription(true);

      finishProcess(
        processId,
        "SUCCESS",
        "แต่งคำบรรยายครบทุกภาษาเรียบร้อยแล้ว! ✨",
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "การทำงานขัดข้อง";
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
