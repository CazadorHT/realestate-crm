export type DocumentWithRelations = {
  id: string;
  file_name: string;
  size_bytes: number | null;
  document_type: string | null;
  storage_path: string;
  created_at: string;
  owner_type: string;
  owner_id: string;
  property?: { id: string; title: string } | null;
  lead?: { id: string; full_name: string | null; email: string | null } | null;
  deal?: { id: string; property: { title: string } | null } | null;
  rental_contract?: { id: string; property: { title: string } | null } | null;
};
