"use client";

import { useState, useEffect } from "react";
import { getPartners } from "@/features/admin/partners-actions";
import { Handshake, Handshake as HandshakeIcon, CheckCircle, XCircle, Search, X } from "lucide-react";
import { PartnersTable } from "@/features/admin/components/PartnersTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CreatePartnerDialog } from "@/features/admin/components/CreatePartnerDialog";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { Database } from "@/lib/database.types";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
type Partner = Database["public"]["Tables"]["partners"]["Row"];
interface PartnersContentProps {
  isSuperAdmin: boolean;
  initialData?: Partner[];
  initialCount?: number;
}

export function PartnersContent({ 
  isSuperAdmin,
  initialData = [],
  initialCount = 0
}: PartnersContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // URL Params state
  const currentPage = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("q") || "";
  const pageSize = 10;

  const [partners, setPartners] = useState<Partner[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const fetchPartners = async (page: number, q: string) => {
    setLoading(true);
    try {
      const result = await getPartners({
        page,
        pageSize,
        search: q,
      });
      
      if (result.success) {
        setPartners(result.data);
        setTotalCount(result.totalCount);
        
        // Handle out-of-bounds page
        const maxPage = Math.ceil(result.totalCount / pageSize);
        if (page > 1 && page > maxPage && maxPage > 0) {
          updateUrl({ page: maxPage });
        }
      }
    } catch (error) {
      console.error("Failed to fetch partners:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync fetch with search params
  useEffect(() => {
    fetchPartners(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  // Debounced Search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateUrl({ q: searchInput, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateUrl = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSuccess = () => {
    setOpen(false);
    fetchPartners(currentPage, searchQuery);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchInput("");
    updateUrl({ q: null, page: 1 });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SuccessAnimation />
      <PageHeader
        title="พาร์ทเนอร์ (Partners)"
        subtitle="จัดการพาร์ทเนอร์และบริษัทที่ร่วมงาน"
        count={totalCount}
        icon="handshake"
        actionSlot={
          isSuperAdmin && <CreatePartnerDialog onSuccess={handleSuccess} />
        }
        gradient="rose"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm  flex items-center gap-4 transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <Handshake className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
              ทั้งหมด
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {totalCount}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
              เปิดใช้งาน
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {partners.filter((p) => p.is_active).length}{" "}
              <span className="text-xs font-normal text-slate-400"> (ในหน้านี้)</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
              ปิดใช้งาน
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {partners.filter((p) => !p.is_active).length}{" "}
              <span className="text-xs font-normal text-slate-400"> (ในหน้านี้)</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <SectionTitle
            title="รายการพาร์ทเนอร์"
            subtitle="แสดงรายชื่อบริษัทพาร์ทเนอร์และลำดับการแสดงผล"
          />
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาชื่อพาร์ทเนอร์..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9 bg-white border-slate-200 rounded-xl focus-visible:ring-rose-500"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rowCount={pageSize} columnCount={5} />
        ) : partners.length > 0 ? (
          <div className="space-y-4">
            <PartnersTable 
              partners={partners} 
              isSuperAdmin={isSuperAdmin} 
              onRefresh={() => fetchPartners(currentPage, searchQuery)}
            />
            <PaginationControls
              totalCount={totalCount}
              pageSize={pageSize}
              currentPage={currentPage}
            />
          </div>
        ) : (
          <EmptyState
            title={searchQuery ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีข้อมูลพาร์ทเนอร์"}
            description={searchQuery ? `ไม่พบพาร์ทเนอร์ที่ตรงกับ "${searchQuery}"` : "เริ่มเพิ่มพาร์ทเนอร์รายแรกเพื่อแสดงบนหน้าเว็บไซต์ของคุณ"}
            icon="handshake"
            actionLabel={isSuperAdmin ? (searchQuery ? "ล้างการค้นหา" : "เพิ่มพาร์ทเนอร์") : undefined}
            onAction={isSuperAdmin ? (searchQuery ? clearSearch : () => setOpen(true)) : undefined}
          />
        )}
      </div>
    </div>
  );
}
