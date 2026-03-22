/**
 * Pure function to calculate new sort orders for a list of partners
 */
export function calculateNewSortOrders(partners: { id: string, sort_order: number | null }[]) {
  return partners.map((p, index) => {
    const newOrder = index + 1;
    if (p.sort_order !== newOrder) {
      return { id: p.id, sort_order: newOrder };
    }
    return null;
  }).filter((p): p is { id: string, sort_order: number } => p !== null);
}
