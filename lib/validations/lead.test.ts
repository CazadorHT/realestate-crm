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

  describe('Social Media / International Contacts', () => {
    it('should accept optional line_id, wechat_id, and whatsapp', () => {
      const data = {
        full_name: 'A',
        line_id: 'line123',
        wechat_id: 'wechat123',
        whatsapp: 'whatsapp123'
      };
      const result = leadFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.line_id).toBe('line123');
        expect(result.data.wechat_id).toBe('wechat123');
        expect(result.data.whatsapp).toBe('whatsapp123');
      }
    });

    it('should allow empty social fields', () => {
      const data = {
        full_name: 'A',
        line_id: '',
        wechat_id: null,
      };
      const result = leadFormSchema.safeParse(data);
      expect(result.success).toBe(true);
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

  describe('Brutal User Errors & Edge Cases', () => {
    it('should handle XSS attempts in full_name by accepting raw (Sanitization is UI layer)', () => {
      const xssName = '<script>alert("hack")</script> Hunter';
      const result = leadFormSchema.safeParse({ full_name: xssName });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.full_name).toBe(xssName);
      }
    });

    it('should fail for extremely invalid email formats', () => {
      const badEmails = [
        'plainaddress',
        '#@%^%#$@#$@#.com',
        '@example.com',
        'Joe Smith <email@example.com>',
        'email.example.com',
        'email@example@example.com',
        '.email@example.com',
        'email.@example.com',
        'email..email@example.com',
        'email@example',
        'email@-example.com',
        'email@example..com',
        'Abc..123@example.com'
      ];

      badEmails.forEach(email => {
        const result = leadFormSchema.safeParse({ full_name: 'A', email });
        expect(result.success, `Should fail for: ${email}`).toBe(false);
      });
    });

    it('should be brutal with phone number weirdness', () => {
      const badPhones = [
        '081', // Too short
        '081234567890123', // Too long
        'abcdefghij', // Not numbers
        '1812345678', // Doesn't start with 0
        '08-123-456-78-9', // Malformed digits
        '   ', // Just spaces
        '081.234.5678', // Dot is not supported
      ];

      badPhones.forEach(phone => {
        const result = leadFormSchema.safeParse({ full_name: 'A', phone });
        expect(result.success, `Should fail for phone: ${phone}`).toBe(false);
      });
    });

    it('should handle budget entries that are pure nonsense', () => {
      const badBudgets = [
        'ten thousand',
        '-500',
        '1.2.3',
        '   abc   '
      ];

      badBudgets.forEach(budget => {
        const result = leadFormSchema.safeParse({ full_name: 'A', budget_min: budget });
        // Our nullableNumber returns null for NaN, but we have min(0) validation
        if (result.success) {
          expect(result.data.budget_min).toBe(null);
        } else {
          // If it fails, it's likely due to .min(0) if it parsed as a negative number
          expect(result.success).toBe(false);
        }
      });
    });
  });
});
