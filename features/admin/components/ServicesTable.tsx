"use client";

import { useState } from "react";
import { type ServiceRow } from "@/features/services/actions";
import { useServicesActions } from "@/features/services/hooks/useServicesActions";

// Sub-components
import { ServicesTableTabs } from "@/features/services/components/ServicesTableTabs";
import { ServicesTableDesktop } from "@/features/services/components/ServicesTableDesktop";
import { ServicesTableMobile } from "@/features/services/components/ServicesTableMobile";
import { ServicesActionDialogs } from "@/features/services/components/ServicesActionDialogs";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ServiceForm } from "./ServiceForm";

interface ServicesTableProps {
  services: ServiceRow[];
  totalCount: number;
  currentPage: number;
  activeCount?: number;
  trashCount?: number;
}

export function ServicesTable({
  services,
  totalCount,
  currentPage,
  activeCount = 0,
  trashCount = 0,
}: ServicesTableProps) {
  const {
    isPending,
    isDeleting,
    activeTab,
    isTrashView,
    deletingId,
    setDeletingId,
    permanentDeletingId,
    setPermanentDeletingId,
    confirmName,
    setConfirmName,
    isEmptyTrashOpen,
    setIsEmptyTrashOpen,
    handleViewChange,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    handleEmptyTrash,
    handleCleanup,
  } = useServicesActions();

  const [editingService, setEditingService] = useState<ServiceRow | null>(null);

  const handleEditSuccess = () => {
    setEditingService(null);
    // Refreshing is handled by router.refresh() inside hook logic if we use that pattern, 
    // but here we just rely on the parent page re-fetching.
  };

  return (
    <>
      <div className="space-y-6">
        {/* Segmented Controller: Elite Standard */}
        <ServicesTableTabs 
           activeTab={activeTab}
           onViewChange={handleViewChange}
           activeCount={activeCount}
           trashCount={trashCount}
           onCleanup={handleCleanup}
           onEmptyTrash={() => setIsEmptyTrashOpen(true)}
           isPending={isPending}
        />

        <div className="space-y-4">
          {/* Desktop Table View */}
          <ServicesTableDesktop 
            services={services}
            isTrashView={isTrashView}
            isPending={isPending}
            onEdit={setEditingService}
            onDelete={setDeletingId}
            onRestore={handleRestore}
            onPermanentDelete={setPermanentDeletingId}
          />

          {/* Mobile & Tablet Card View */}
          <ServicesTableMobile 
            services={services}
            isTrashView={isTrashView}
            isPending={isPending}
            onEdit={setEditingService}
            onDelete={setDeletingId}
            onRestore={handleRestore}
            onPermanentDelete={setPermanentDeletingId}
          />

          {/* Pagination */}
          <div className="pt-2">
            <PaginationControls
              totalCount={totalCount}
              pageSize={10}
              currentPage={currentPage}
            />
          </div>
        </div>

        {/* Modular Action Dialogs */}
        <ServicesActionDialogs 
           deletingId={deletingId}
           setDeletingId={setDeletingId}
           isDeleting={isDeleting}
           onDelete={handleDelete}
           permanentDeletingId={permanentDeletingId}
           setPermanentDeletingId={setPermanentDeletingId}
           confirmName={confirmName}
           setConfirmName={setConfirmName}
           onPermanentDelete={handlePermanentDelete}
           isEmptyTrashOpen={isEmptyTrashOpen}
           setIsEmptyTrashOpen={setIsEmptyTrashOpen}
           onEmptyTrash={handleEmptyTrash}
        />

        {/* Edit Form Dialog */}
        <ResponsiveDialog
          open={!!editingService}
          onOpenChange={(open: boolean) => !open && setEditingService(null)}
          title="แก้ไขข้อมูลบริการ"
          description="ปรับปรุงรายละเอียดบริการและรูปภาพหน้าปก"
          className="md:max-w-7xl"
        >
          <div className="max-h-[80vh] overflow-y-auto px-1 py-4">
            {editingService && (
              <ServiceForm
                initialData={editingService}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingService(null)}
              />
            )}
          </div>
        </ResponsiveDialog>
      </div>
    </>
  );
}
