import { describe, it, expect } from 'vitest';
import { 
  generateContractNumber, 
  calculateContractStatus, 
  getContractDurationInDays,
  calculateTotalValue,
  isNearingExpiry
} from './logic';
import { contractFormSchema } from './schema';

describe('Rental Contracts Logic (Hardened)', () => {
  describe('Contract Number Generation', () => {
    it('should generate a contract number in correct format', () => {
      const num = generateContractNumber();
      expect(num).toMatch(/^RC-\d{4}-[A-Z0-9]{6}$/);
    });
  });

  describe('Contract Status Lifecycle', () => {
    const today = new Date('2026-03-30');
    
    it('should be PENDING if start date is in the future', () => {
      const status = calculateContractStatus('2026-04-01', '2027-04-01', today);
      expect(status).toBe('PENDING');
    });

    it('should be ACTIVE if today is within range', () => {
      const status = calculateContractStatus('2026-03-01', '2027-03-01', today);
      expect(status).toBe('ACTIVE');
    });

    it('should be EXPIRED if end date is in the past', () => {
      const status = calculateContractStatus('2025-03-01', '2026-03-20', today);
      expect(status).toBe('EXPIRED');
    });

    it('should detect nearing expiry within 30 days', () => {
      // 2026-04-20 is 21 days from 2026-03-30
      expect(isNearingExpiry('2026-04-20', 30, today)).toBe(true);
      // 2026-05-30 is far away
      expect(isNearingExpiry('2026-05-30', 30, today)).toBe(false);
    });
  });

  describe('Contract Duration & Value', () => {
    it('should calculate correct duration in days', () => {
      const days = getContractDurationInDays('2026-03-01', '2026-03-11');
      expect(days).toBe(10);
    });

    it('should calculate total contract value correctly', () => {
      expect(calculateTotalValue(20000, 12)).toBe(240000);
      expect(calculateTotalValue(-100, 10)).toBe(0);
    });
  });

  describe('Schema Validation Hardening', () => {
    it('should fail if end_date is before start_date', () => {
      const invalidData = {
        deal_id: '550e8400-e29b-41d4-a716-446655440000',
        start_date: '2026-12-01',
        end_date: '2026-11-01', // Error
        rent_price: 15000,
        lease_term_months: 12
      };
      
      const result = contractFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('สิ้นสุดสัญญาต้องอยู่หลังจากวันที่เริ่มสัญญา');
      }
    });

    it('should pass for valid date ranges', () => {
      const validData = {
        deal_id: '550e8400-e29b-41d4-a716-446655440000',
        start_date: '2026-01-01',
        end_date: '2027-01-01',
        rent_price: 15000,
        lease_term_months: 12
      };
      
      const result = contractFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
