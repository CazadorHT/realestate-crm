import { describe, it, expect } from 'vitest';
import { leadFormSchema } from './lead';

describe('Lead Validation (Zod)', () => {
  it('should validate a correct lead form', () => {
    const validData = {
      full_name: 'Hunter Developer',
      phone: '0812345678',
      email: 'test@example.com',
      stage: 'NEW',
    };
    const result = leadFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if full_name is empty', () => {
    const invalidData = {
      full_name: '',
      phone: '0812345678',
    };
    const result = leadFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  describe('Phone number validation', () => {
    it('should accept 10-digit Thai phone numbers starting with 0', () => {
      expect(leadFormSchema.safeParse({ full_name: 'A', phone: '0812345678' }).success).toBe(true);
      expect(leadFormSchema.safeParse({ full_name: 'A', phone: '021234567' }).success).toBe(true);
    });

    it('should strip spaces and hyphens before validation', () => {
      expect(leadFormSchema.safeParse({ full_name: 'A', phone: '081-234-5678' }).success).toBe(true);
      expect(leadFormSchema.safeParse({ full_name: 'A', phone: '081 234 5678' }).success).toBe(true);
    });

    it('should fail for numbers not starting with 0', () => {
      const result = leadFormSchema.safeParse({ full_name: 'A', phone: '1812345678' });
      expect(result.success).toBe(false);
    });

    it('should fail for too short or too long numbers', () => {
      expect(leadFormSchema.safeParse({ full_name: 'A', phone: '081' }).success).toBe(false);
      expect(leadFormSchema.safeParse({ full_name: 'A', phone: '081234567890' }).success).toBe(false);
    });
  });

  describe('Budget handling (nullableNumber)', () => {
    it('should handle empty string as null', () => {
      const result = leadFormSchema.safeParse({ full_name: 'A', budget_min: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budget_min).toBe(null);
      }
    });

    it('should parse valid numbers', () => {
      const result = leadFormSchema.safeParse({ full_name: 'A', budget_min: '1000' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budget_min).toBe(1000);
      }
    });
  });
});
