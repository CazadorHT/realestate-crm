"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { PropertyFormValues } from "@/features/properties/schema";
import { translateTextAction } from "@/lib/ai/translation-actions";

export function useAITranslation(form: UseFormReturn<PropertyFormValues>) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  // 1. Translate Title
  const translateTitle = async (silent = false) => {
    const title = form.getValues("title");
    if (!title?.trim()) {
      if (!silent) toast.error("กรุณากรอกชื่อภาษาไทยก่อนกดแปลครับ");
      return;
    }

    const hasEn = !!form.getValues("title_en");
    const hasCn = !!form.getValues("title_cn");
    if (hasEn && hasCn) {
      if (!silent) toast.success("ชื่อทรัพย์แปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    let toastId;
    if (!silent) toastId = toast.loading("กำลังแปลชื่อเป็นภาษาอังกฤษและจีน...");

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
      if (!silent) toast.success("แปลชื่อเรียบร้อยแล้ว ✨", { id: toastId });
      return true;
    } catch (error: any) {
      if (!silent)
        toast.error(error.message || "การแปลขัดข้อง", { id: toastId });
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 2. Translate Description
  const translateDescription = async (silent = false) => {
    const desc = form.getValues("description");
    if (!desc || desc.trim() === "" || desc === "<p></p>") {
      if (!silent) toast.error("กรุณากรอกคำบรรยายภาษาไทยก่อนกดแปลครับ");
      return;
    }

    const hasEn =
      !!form.getValues("description_en") &&
      form.getValues("description_en") !== "<p></p>";
    const hasCn =
      !!form.getValues("description_cn") &&
      form.getValues("description_cn") !== "<p></p>";
    if (hasEn && hasCn) {
      if (!silent) toast.success("คำบรรยายแปลครบถ้วนแล้ว ✨");
      return;
    }

    setIsTranslating(true);
    let toastId;
    if (!silent)
      toastId = toast.loading("กำลังแปลคำบรรยายเป็นภาษาอังกฤษและจีน...");

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
      if (!silent)
        toast.success("แปลคำบรรยายเรียบร้อยแล้ว ✨", { id: toastId });
      return true;
    } catch (error: any) {
      if (!silent)
        toast.error(error.message || "การแปลขัดข้อง", { id: toastId });
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
      (t: any) => t.station_name && (!t.station_name_en || !t.station_name_cn),
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
          };
        }
        return t;
      });

      form.setValue("nearby_transits", updatedTransits, { shouldDirty: true });
      if (!silent)
        toast.success(
          `แปลข้อมูลสถานีรถไฟฟ้าเรียบร้อยแล้ว ${results.length} รายการ ✨`,
        );
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
      (p: any) => p.name && (!p.name_en || !p.name_cn),
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
          };
        }
        return p;
      });

      form.setValue("nearby_places", updatedPlaces, { shouldDirty: true });
      if (!silent)
        toast.success(
          `แปลข้อมูลสถานที่ใกล้เคียงเรียบร้อยแล้ว ${results.length} รายการ ✨`,
        );
      return true;
    } catch (error) {
      if (!silent) toast.error("การแปลสถานที่ใกล้เคียงขัดข้อง");
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // 5. Global Translate All
  const translateAll = async () => {
    setIsTranslatingAll(true);
    const toastId = toast.loading("กำลังแปลข้อมูลทั้งหมดด้วย AI...");

    try {
      await Promise.all([
        translateTitle(true),
        translateDescription(true),
        translateTransits(true),
        translatePlaces(true),
      ]);
      toast.success("แปลข้อมูลครบทุกส่วนเรียบร้อยแล้ว! ✨", { id: toastId });
    } catch (error) {
      toast.error("การแปลข้อมูลแบบรวมขัดข้อง", { id: toastId });
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
    translateAll,
  };
}
