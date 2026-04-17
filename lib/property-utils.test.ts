import { describe, it, expect } from 'vitest';
import { 
  canDeleteProperty, 
  getStatusLabel, 
  getTypeLabel,
  formatPrice,
  isStatusChangeAllowed,
  isUserAuthorized
} from './property-utils';

describe('Property Utilities (Enterprise Business Rules)', () => {
  describe('canDeleteProperty Logic', () => {
    it('should allow deletion of ACTIVE, RESERVED, or INACTIVE properties', () => {
      expect(canDeleteProperty('ACTIVE')).toBe(true);
      expect(canDeleteProperty('RESERVED')).toBe(true);
      expect(canDeleteProperty('INACTIVE')).toBe(true);
      expect(canDeleteProperty(null)).toBe(true);
    });

    it('should restrict deletion of SOLD properties', () => {
      expect(canDeleteProperty('SOLD')).toBe(false);
      expect(canDeleteProperty('sold')).toBe(false); // Case insensitive check
    });

    it('should restrict deletion of RENTED properties', () => {
      expect(canDeleteProperty('RENTED')).toBe(false);
    });
  });

  describe('getStatusLabel Localization', () => {
    it('should return correct Thai label for standard statuses', () => {
      expect(getStatusLabel('ACTIVE')).toBe('พร้อมขาย/เช่า');
      expect(getStatusLabel('SOLD')).toBe('ขายแล้ว');
    });

    it('should return raw status if label is missing', () => {
      expect(getStatusLabel('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
    });

    it('should return N/A for null status', () => {
      expect(getStatusLabel(null)).toBe('N/A');
    });
  });

  describe('Formatting Utils', () => {
    it('should format price with Thai Baht symbol by default', () => {
      expect(formatPrice(1000000)).toContain('฿');
      expect(formatPrice(1000000)).toContain('1,000,000');
    });
  });

  describe('isStatusChangeAllowed Logic', () => {
    it('should block transition from DRAFT to ACTIVE if AI review is required', () => {
      const result = isStatusChangeAllowed('DRAFT', 'ACTIVE', true);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('AI');
    });

    it('should allow staying in DRAFT even if AI review is required', () => {
      const result = isStatusChangeAllowed('DRAFT', 'DRAFT', true);
      expect(result.allowed).toBe(true);
    });

    it('should allow transition if AI review is NOT required', () => {
      const result = isStatusChangeAllowed('DRAFT', 'ACTIVE', false);
      expect(result.allowed).toBe(true);
    });
  });

  describe('isUserAuthorized Logic', () => {
    const tenantId = 'tenant-123';
    const ownerId = 'user-owner';

    it('should allow ADMIN to bypass ownership', () => {
      const user = { id: 'admin-id', role: 'ADMIN' };
      const property = { created_by: ownerId, tenant_id: tenantId };
      expect(isUserAuthorized(user, property, tenantId)).toBe(true);
    });

    it('should allow owner to edit their own property', () => {
      const user = { id: ownerId, role: 'AGENT' };
      const property = { created_by: ownerId, tenant_id: tenantId };
      expect(isUserAuthorized(user, property, tenantId)).toBe(true);
    });

    it('should block agent from editing others property', () => {
      const user = { id: 'other-agent', role: 'AGENT' };
      const property = { created_by: ownerId, tenant_id: tenantId };
      expect(isUserAuthorized(user, property, tenantId)).toBe(false);
    });

    it('should block access if tenant ID does not match', () => {
      const user = { id: 'admin-id', role: 'ADMIN' };
      const property = { created_by: ownerId, tenant_id: 'wrong-tenant' };
      expect(isUserAuthorized(user, property, tenantId)).toBe(false);
    });
  });
});
