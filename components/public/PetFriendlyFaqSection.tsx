"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { FaqAccordion } from "@/components/public/FaqAccordion";

export function PetFriendlyFaqSection() {
  const { t } = useLanguage();

  return (
    <div className="animate-fade-in-up delay-300">
      <FaqAccordion
        title={t("silo_landing.pet_friendly.faq_section_title")}
        items={[
          {
            q: t("silo_landing.pet_friendly.faq_q1"),
            a: t("silo_landing.pet_friendly.faq_a1"),
          },
          {
            q: t("silo_landing.pet_friendly.faq_q2"),
            a: t("silo_landing.pet_friendly.faq_a2"),
          },
          {
            q: t("silo_landing.pet_friendly.faq_q3"),
            a: t("silo_landing.pet_friendly.faq_a3"),
          },
        ]}
      />
    </div>
  );
}
