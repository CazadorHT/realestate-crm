export function calculatePropertyCounts(owners: { id: string }[], propertyOwnerIds: { owner_id: string | null }[]) {
  const countMap = new Map<string, number>();
  propertyOwnerIds.forEach((p) => {
    if (p.owner_id) {
      countMap.set(p.owner_id, (countMap.get(p.owner_id) || 0) + 1);
    }
  });

  return owners.map((owner) => ({
    ...owner,
    property_count: countMap.get(owner.id) || 0,
  }));
}
