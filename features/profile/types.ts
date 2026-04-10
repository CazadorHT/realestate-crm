export interface TenantMembership {
  role: string | null;
  tenant: {
    id: string;
    name: string;
  } | null;
}
