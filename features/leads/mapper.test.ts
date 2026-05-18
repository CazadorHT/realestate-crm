import { describe, it, expect, vi } from 'vitest';
import { leadRowToFormValues } from './mapper';
import { LeadWithJoins } from './types';
import { encrypt } from '@/lib/crypto';

// Mock encryption secret for consistent testing
process.env.ENCRYPTION_SECRET = "test-secret-must-be-32-chars-long-!!!";

describe('Lead Mapper - leadRowToFormValues', () => {
  const mockRow: LeadWithJoins = {
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
    budget_max: 500000,
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
    ai_summary_content: null,
    full_name_hash: null,
    phone_hash: null,
    email_hash: null,
    line_id_hash: null,
    wechat_id: 'wechat123',
    whatsapp: '+66812345678',
    ai_summary: null,
    identity_id: 'identity-1',
    requirements_embedding: null,
    status: 'ACTIVE',
    utm_data: null,
  };

  it('should map a raw lead row to form values correctly (Backward Compatibility)', () => {
    const values = leadRowToFormValues(mockRow);
    
    expect(values.full_name).toBe('Hunter Developer');
    expect(values.phone).toBe('0812345678');
    expect(values.email).toBe('hunter@test.com');
    expect(values.line_id).toBe('test-line');
    expect(values.wechat_id).toBe('wechat123');
    expect(values.whatsapp).toBe('+66812345678');
  });

  it('should decrypt encrypted PII fields correctly', () => {
    const encryptedRow: LeadWithJoins = {
      ...mockRow,
      full_name: encrypt('Encrypted Name')!,
      phone: encrypt('0999999999')!,
      email: encrypt('secret@agent.com')!,
      line_id: encrypt('secret-line')!,
    };

    const values = leadRowToFormValues(encryptedRow);
    
    expect(values.full_name).toBe('Encrypted Name');
    expect(values.phone).toBe('0999999999');
    expect(values.email).toBe('secret@agent.com');
    expect(values.line_id).toBe('secret-line');
  });

  it('should fallback to null or default for empty fields', () => {
    const emptyRow: LeadWithJoins = {
      ...mockRow,
      phone: null,
      email: null,
      budget_min: null,
      is_foreigner: false,
      preferences: null,
      wechat_id: null,
      whatsapp: null,
    };
    
    const values = leadRowToFormValues(emptyRow);
    
    expect(values.phone).toBe(null);
    expect(values.budget_min).toBe(null);
    expect(values.is_foreigner).toBe(false);
    expect(values.preferences).toBe(null);
    expect(values.wechat_id).toBe(null);
    expect(values.whatsapp).toBe(null);
  });

  describe('Brutal Mapper Edge Cases', () => {
    it('should handle completely missing fields gracefully', () => {
      // @ts-ignore - Testing runtime resilience against bad DB data
      const corruptedRow: LeadWithJoins = { id: 'bad-1' };
      const values = leadRowToFormValues(corruptedRow);
      
      expect(values.full_name).toBe("");
      expect(values.phone).toBe(null);
      expect(values.email).toBe(null);
      expect(values.stage).toBe("NEW"); // Should match DB default behavior
    });

    it('should handle malformed JSON in preferences', () => {
      const rowWithBadJson: LeadWithJoins = {
        ...mockRow,
        preferences: "not-json-but-string" as any
      };
      const values = leadRowToFormValues(rowWithBadJson);
      expect(values.preferences).toBe("not-json-but-string");
    });

    it('should handle numbers passed as strings and vice versa for IDs', () => {
      const weirdRow: LeadWithJoins = {
        ...mockRow,
        budget_min: "500000" as any,
        is_foreigner: "true" as any,
      };
      const values = leadRowToFormValues(weirdRow);
      expect(values.budget_min).toBe(500000);
      expect(values.is_foreigner).toBe(true);
    });
  });
});
