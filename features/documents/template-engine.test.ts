import { describe, it, expect } from 'vitest';
import { 
  replacePlaceholders, 
  amountToThaiWords, 
  amountToEnglishWords, 
  localizeObject,
  formatCurrency,
  formatDate
} from './template-engine';

describe('Document Template Engine - replacePlaceholders', () => {
  it('should replace simple placeholders', () => {
    const template = 'Hello {{name}}';
    const data = { name: 'Hunter' };
    expect(replacePlaceholders(template, data)).toBe('Hello Hunter');
  });

  it('should support nested object access', () => {
    const template = 'Address: {{user.address.city}}';
    const data = { user: { address: { city: 'Bangkok' } } };
    expect(replacePlaceholders(template, data)).toBe('Address: Bangkok');
  });

  it('should return empty string for missing keys', () => {
    const template = 'Value: {{missing}}';
    expect(replacePlaceholders(template, {})).toBe('Value: ');
  });
});

describe('Document Template Engine - amountToThaiWords', () => {
  it('should convert small numbers correctly', () => {
    expect(amountToThaiWords(10)).toBe('สิบบาทถ้วน');
    expect(amountToThaiWords(21)).toBe('ยี่สิบเอ็ดบาทถ้วน');
    expect(amountToThaiWords(101)).toBe('หนึ่งร้อยหนึ่งบาทถ้วน');
  });

  it('should handle satang accurately', () => {
    expect(amountToThaiWords(10.50)).toBe('สิบบาทห้าสิบสตางค์');
    expect(amountToThaiWords(0.25)).toBe('ศูนย์บาทยี่สิบห้าสตางค์');
  });

  it('should handle large numbers correctly', () => {
    expect(amountToThaiWords(1000000)).toBe('หนึ่งล้านบาทถ้วน');
    expect(amountToThaiWords(1234567.89)).toBe('หนึ่งล้านสองแสนสามหมื่นสี่พันห้าร้อยหกสิบเจ็ดบาทแปดสิบเก้าสตางค์');
  });
});

describe('Document Template Engine - amountToEnglishWords', () => {
  it('should convert numbers to English words', () => {
    expect(amountToEnglishWords(123)).toBe('One Hundred and Twenty-Three Baht Only');
    expect(amountToEnglishWords(1500.50)).toBe('One Thousand Five Hundred Baht and Fifty Satang');
  });
});

describe('Document Template Engine - localizeObject', () => {
  it('should alias localized fields to base fields', () => {
    const obj = { title: 'Thai Title', title_en: 'English Title' };
    const localized = localizeObject(obj, 'en');
    expect(localized.title).toBe('English Title');
  });

  it('should retain original values if no translation exists', () => {
    const obj = { title: 'Thai Title' };
    const localized = localizeObject(obj, 'en');
    expect(localized.title).toBe('Thai Title');
  });
});

describe('Document Template Engine - Helpers', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1234.5)).toBe('1,234.50');
  });

  it('should format dates based on language', () => {
    const date = '2024-01-01';
    expect(formatDate(date, 'en')).toContain('January');
    expect(formatDate(date, 'th')).toContain('มกราคม');
  });
});
