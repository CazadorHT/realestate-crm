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
  deal?: {
    id: string;
    property: { title: string } | null;
    lead?: {
      id: string;
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
  rental_contract?: {
    id: string;
    deal?: {
      id: string;
      property: { title: string } | null;
      lead?: {
        id: string;
        full_name: string | null;
        email: string | null;
      } | null;
    } | null;
  } | null;
  esign_status?: string | null;
  esign_envelope_id?: string | null;
  esign_signed_at?: string | null;
  ai_summary?: string | null;
  ai_analysis?: any | null;
};
