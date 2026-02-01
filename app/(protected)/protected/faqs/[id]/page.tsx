import { getFaq } from "@/features/admin/faqs-actions";
import { FAQForm } from "@/features/admin/components/FAQForm";

export default async function FAQFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  let initialData = null;
  if (!isNew) {
    initialData = await getFaq(id);
  }

  return <FAQForm initialData={initialData} faqId={id} isNew={isNew} />;
}
