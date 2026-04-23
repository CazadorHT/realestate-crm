import { describe, it, expect } from 'vitest';
import { getReadableSummary } from './audit-utils';

describe('Audit Utitilies (Human-readable Summaries)', () => {
  describe('getReadableSummary Formatting', () => {
    it('should format member.transfer correctly', () => {
      const log = {
        action: 'member.transfer',
        entity: 'member',
        metadata: { email: 'test@example.com' }
      };
      expect(getReadableSummary(log)).toBe('ย้ายพนักงาน test@example.com ไปยังสาขาใหม่');
    });

    it('should format property.create correctly', () => {
      const log = {
        action: 'property.create',
        entity: 'property',
        metadata: { title: 'Luxury Condo' }
      };
      expect(getReadableSummary(log)).toBe('เพิ่มทรัพย์สินใหม่: Luxury Condo');
    });

    it('should handle missing metadata with fallbacks', () => {
      const log = {
        action: 'property.create',
        entity: 'property',
        metadata: {}
      };
      expect(getReadableSummary(log)).toBe('เพิ่มทรัพย์สินใหม่: N/A');
    });

    it('should format trash/restore actions we recently added', () => {
      expect(getReadableSummary({ action: 'property.trash', entity: 'property', metadata: {} }))
        .toBe('ย้ายทรัพย์สินลงถังขยะ');
      expect(getReadableSummary({ action: 'property.restore', entity: 'property', metadata: {} }))
        .toBe('กู้คืนทรัพย์สินจากถังขยะ');
    });

    it('should provide dynamic fallbacks for generic actions', () => {
      expect(getReadableSummary({ action: 'custom.delete', entity: 'FAQ', metadata: {} }))
        .toBe('ลบข้อมูล (FAQ)');
      expect(getReadableSummary({ action: 'custom.create', entity: 'Banner', metadata: {} }))
        .toBe('สร้างข้อมูลใหม่ (Banner)');
    });

    it('should return raw action if no pattern matches', () => {
      expect(getReadableSummary({ action: 'unknown.op', entity: 'thing', metadata: {} }))
        .toBe('unknown.op');
    });
  });
});
