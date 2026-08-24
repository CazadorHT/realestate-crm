import { getFaqs } from "@/features/admin/faqs-actions";
import { FaqsPageView } from "@/features/admin/components/FaqsPageView";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { requireAuthContext } from "@/lib/authz";

interface FAQsPageProps {
  searchParams: Promise<{ page?: string; success?: string; view?: string; q?: string }>;
}

export default async function FAQsPage(props: FAQsPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const currentView = searchParams.view || "active";
  const search = searchParams.q || "";
  const isTrash = currentView === "trash";
  const pageSize = 10;

  const { role } = await requireAuthContext();
  const isSuperAdmin = role === "ADMIN";

  // Parallel fetching for counts and data
  const [activeData, trashData] = await Promise.all([
    getFaqs(1, 1, false, search),
    getFaqs(1, 1, true, search),
  ]);

  const activeCount = activeData.count;
  const trashCount = trashData.count;

  // Fetch current page data
  const { faqs, count: currentCount } = await getFaqs(page, pageSize, isTrash, search);

  return (
    <div className="space-y-6 animate-fade-in">
      {searchParams.success === "true" && <SuccessAnimation />}
      
      <FaqsPageView
        faqs={faqs ?? []}
        currentCount={currentCount}
        activeCount={activeCount}
        trashCount={trashCount}
        page={page}
        currentView={currentView}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
