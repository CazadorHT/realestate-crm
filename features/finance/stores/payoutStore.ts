import { create } from 'zustand';

interface PayoutState {
  selectedIds: Set<string>;
  expandedRows: Set<string>;
  
  // Actions
  toggleSelection: (id: string) => void;
  selectVisible: (ids: string[]) => void;
  clearSelection: () => void;
  toggleExpansion: (id: string) => void;
  
  // Helpers
  isItemSelected: (id: string) => boolean;
  isItemExpanded: (id: string) => boolean;
  getTotalSelectedAmount: (payouts: any[]) => number;
}

export const usePayoutStore = create<PayoutState>((set, get) => ({
  selectedIds: new Set(),
  expandedRows: new Set(),

  toggleSelection: (id) => set((state) => {
    const next = new Set(state.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { selectedIds: next };
  }),

  selectVisible: (ids) => set(() => ({
    selectedIds: new Set(ids)
  })),

  clearSelection: () => set({ selectedIds: new Set() }),

  toggleExpansion: (id) => set((state) => {
    const next = new Set(state.expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { expandedRows: next };
  }),

  // Optimized Checkers
  isItemSelected: (id) => get().selectedIds.has(id),
  isItemExpanded: (id) => get().expandedRows.has(id),

  // Computed Totals in Store
  getTotalSelectedAmount: (payouts) => {
    const selected = get().selectedIds;
    return payouts
      .filter(p => selected.has(p.id))
      .reduce((sum, p) => sum + (p.net_transfer_amount || 0), 0);
  }
}));
