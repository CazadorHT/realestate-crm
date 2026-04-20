import { describe, it, expect } from 'vitest';
import { leadRowToFormValues } from './mapper';
import { LeadRow } from './types';

describe('Lead Mapper - leadRowToFormValues', () => {
  const mockRow: LeadRow = {
    id: 'lead-1',
    full_name: 'Hunter Developer',
    email: 'hunter@test.com',
    phone: '0812345678',
    stage: 'NEW',
    source: 'FACEBOOK',
    tenant_id: 'tenant-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    assigned_to: 'agent-1',
    property_id: null,
    budget_min: 1000000,
    budget_max: 5000000,
    note: 'Interested in condos',
    is_foreigner: true,
    nationality: 'Thai',
    lead_type: 'INDIVIDUAL',
    preferences: { remote: true },
    preferred_locations: ['Bangkok', 'Pattaya'],
    preferred_property_types: ['CONDO'],
    min_bedrooms: 1,
    min_bathrooms: 1,
    min_size_sqm: 30,
    max_size_sqm: 100,
    num_occupants: 2,
    has_pets: false,
    need_company_registration: false,
    allow_airbnb: false,
    pdpa_consent: true,
    consent_date: '2024-01-01',
    created_by: 'user-1',
    ai_score: null,
    ai_status_label: null,
    facebook_psid: null,
    instagram_sid: null,
    last_viewed_at: null,
    line_id: "test-line",
    embedding: null,
    utm_campaign: null,
    utm_content: null,
    utm_medium: null,
    utm_source: null,
    utm_term: null,
    referral_url: null,
  };

  it('should map a full lead row to form values correctly', () => {
    const values = leadRowToFormValues(mockRow);
    
    expect(values.full_name).toBe('Hunter Developer');
    expect(values.is_foreigner).toBe(true);
    expect(values.budget_min).toBe(1000000);
    expect(values.preferences).toEqual({ remote: true });
    expect(values.preferred_locations).toEqual(['Bangkok', 'Pattaya']);
  });

  it('should fallback to null or default for empty fields', () => {
    const emptyRow: LeadRow = {
      ...mockRow,
      phone: null,
      email: null,
      budget_min: null,
      is_foreigner: false,
      preferences: null,
    };
    
    const values = leadRowToFormValues(emptyRow);
    
    expect(values.phone).toBe(null);
    expect(values.budget_min).toBe(null);
    expect(values.is_foreigner).toBe(false);
    expect(values.preferences).toBe(null);
  });
});
