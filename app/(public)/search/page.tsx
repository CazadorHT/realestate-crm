import { redirect } from "next/navigation";
import { getServerTranslations, getLangPrefix } from "@/lib/i18n";

export default async function SearchPage() {
  const { language } = await getServerTranslations();
  const langPrefix = getLangPrefix(language);
  redirect(`${langPrefix}/properties`);
}
