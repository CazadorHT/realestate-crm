"use client";

import { useState, useCallback, useMemo } from "react";

export interface UseTableSelectionReturn<T extends string = string> {
  selectedIds: Set<T>;
  toggleSelect: (id: T) => void;
  toggleSelectAll: (allIds: T[]) => void;
  clearSelection: () => void;
  isSelected: (id: T) => boolean;
  isAllSelected: boolean;
  isPartialSelected: boolean;
  selectedCount: number;
}

/**
 * Hook สำหรับจัดการ selection state ของตาราง
 * ใช้สำหรับ bulk actions เช่น ลบหลายรายการ
 */
export function useTableSelection<T extends string = string>(
  allIds: T[] = []
): UseTableSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggleSelect = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((allIds: T[]) => {
    setSelectedIds((prev) => {
      // ถ้าเลือกครบแล้ว → ยกเลิกทั้งหมด
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      // เลือกทั้งหมด
      return new Set(allIds);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const isAllSelected = useMemo(() => {
    if (allIds.length === 0) return false;
    return allIds.every((id) => selectedIds.has(id));
  }, [allIds, selectedIds]);

  const isPartialSelected = useMemo(() => {
    if (allIds.length === 0) return false;
    const someSelected = allIds.some((id) => selectedIds.has(id));
    return someSelected && !isAllSelected;
  }, [allIds, selectedIds, isAllSelected]);

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount: selectedIds.size,
  };
}
