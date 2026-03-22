import { describe, it, expect } from 'vitest';
import { createTenantSchema } from '../validations/tenant';

describe('Tenant Management Validation', () => {
  describe('createTenantSchema', () => {
    it('should validate a correct tenant name and slug', () => {
      const result = createTenantSchema.safeParse({ name: 'Bangkok Branch', slug: 'bkk-branch' });
      expect(result.success).toBe(true);
    });

    it('should fail if name is too short', () => {
      const result = createTenantSchema.safeParse({ name: 'A', slug: 'bkk' });
      expect(result.success).toBe(false);
    });

    it('should fail if slug contains uppercase letters', () => {
      const result = createTenantSchema.safeParse({ name: 'BKK', slug: 'BKK' });
      expect(result.success).toBe(false);
    });

    it('should fail if slug contains special characters other than hyphen', () => {
      const result = createTenantSchema.safeParse({ name: 'BKK', slug: 'bkk_branch' });
      expect(result.success).toBe(false);
    });
  });
});
