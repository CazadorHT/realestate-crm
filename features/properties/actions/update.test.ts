import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePropertyAction } from "./update";
import { requireAuthContext, UserRole } from "@/lib/authz";
import { PropertyFormValues } from "../schema";

// Mocks
vi.mock("@/lib/authz", () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
  assertAuthenticated: vi.fn(),
  authzFail: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("updatePropertyAction", () => {
  const mockUser = { id: "user-123" };
  const mockTenantId = "tenant-456";

  const createMockSupabase = () => {
    const mock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: "AGENT" } }),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    };
    return mock;
  };

  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: mockSupabase,
      user: mockUser as unknown as import("@supabase/supabase-js").User,
      role: "AGENT" as UserRole,
      tenantId: mockTenantId,
    });
  });

  const validFormValues: PropertyFormValues = {
    title: "Test Property",
    title_en: "Test Property EN",
    description: "Description",
    description_en: "Description EN",
    property_type: "CONDO",
    listing_type: "SALE",
    status: "ACTIVE",
    price: 1000000,
    original_price: 1000000,
    rental_price: 0,
    original_rental_price: 0,
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 30,
    land_size_sqwah: 0,
    address_line1: "Address",
    district: "District",
    province: "Province",
    subdistrict: "Subdistrict",
    currency: "THB",
    total_units: 1,
    sold_units: 0,
    requires_ai_review: false,
    agent_ids: [],
    feature_ids: [],
    commission_sale_percentage: 3,
    commission_rent_months: 1,
    near_transit: false,
    is_co_agent: false,
    verified: false,
    is_pet_friendly: false,
    is_foreigner_quota: false,
    allow_smoking: false,
    allow_airbnb: false,
    is_renovated: false,
    is_fully_furnished: false,
    is_corner_unit: false,
    has_private_pool: false,
    is_selling_with_tenant: false,
    is_bare_shell: false,
    is_exclusive: false,
    has_garden_view: false,
    has_pool_view: false,
    has_city_view: false,
    has_unblocked_view: false,
    has_river_view: false,
    facing_north: false,
    facing_south: false,
    facing_east: false,
    facing_west: false,
    has_multi_parking: false,
    is_grade_a: false,
    is_grade_b: false,
    is_grade_c: false,
    is_column_free: false,
    is_central_air: false,
    is_split_air: false,
    has_247_access: false,
    has_fiber_optic: false,
    is_tax_registered: false,
    has_raised_floor: false,
    is_high_ceiling: false,
    is_cbd: false,
    is_smart_home: false,
    has_private_elevator: false,
    is_handicapped_friendly: false,
    is_high_floor: false,
    is_green_building: false,
    has_flexible_lease: false,
    is_fully_fitted: false,
    is_never_lived_in: false,
    has_large_kitchen: false,
    has_western_kitchen: false,
    has_separate_thai_kitchen: false,
    has_bar_counter: false,
    has_bathtub: false,
    has_walk_in_closet: false,
    has_private_garden: false,
    has_garage: false,
    has_bbq_area: false,
    has_home_theatre: false,
    has_private_gym: false,
    has_wine_cellar: false,
    orientation: "N",
    parking_type: "FIXED",
    google_maps_link: "",
    images: [],
    has_nearby_places: false,
    branch_id: "123e4567-e89b-12d3-a456-426614174000",
    view_count: 0,
    trust_score: 1.0,
  } as PropertyFormValues;

  it("should return success when update is successful", async () => {
    const propertyId = "prop-123";
    const formValues: PropertyFormValues = {
      ...validFormValues,
      title: "Updated Title",
    };

    // 1. Mock existing property fetch
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: propertyId,
        tenant_id: mockTenantId,
        status: "ACTIVE",
        listing_type: "SALE",
        property_type: "CONDO",
        properties_details: {
          title: { th: "Old Title" },
          meta_data: { created_by: mockUser.id },
        },
      },
      error: null,
    });

    // 2. Mock core update (.update().eq())
    mockSupabase.eq
      .mockImplementationOnce(() => mockSupabase) // 1. For select
      .mockResolvedValueOnce({ error: null }) // 2. For core update
      .mockResolvedValueOnce({ error: null }); // 3. For details update

    const result = await updatePropertyAction(propertyId, formValues, "session-123");

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith("properties_core");
    expect(mockSupabase.from).toHaveBeenCalledWith("properties_details");
  });

  it("should fail if property is not found", async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const result = await updatePropertyAction("non-existent", validFormValues, "session-123");

    expect(result.success).toBe(false);
    expect(result.message).toBe("Property not found");
  });

  it("should enforce ownership for non-admins", async () => {
    const propertyId = "prop-123";
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: propertyId,
        tenant_id: mockTenantId,
        properties_details: {
          meta_data: { created_by: "different-user" },
        },
      },
      error: null,
    });

    const result = await updatePropertyAction(propertyId, validFormValues, "session-123");

    expect(result.success).toBe(false);
    expect(result.message).toContain("Forbidden");
  });
});
