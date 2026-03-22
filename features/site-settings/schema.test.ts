import { describe, it, expect } from 'vitest';
import { siteSettingsSchema } from './schema';

describe('Site Settings Validation (Zod)', () => {
  const validSettings = {
    site_name: 'Real Estate CRM',
    company_name: 'Hunter Dev Co.',
    site_description: 'Modern CRM for real estate agents',
    contact_phone: '0812345678',
    contact_email: 'contact@hunter.dev',
    contact_address: '123 Sukhumvit, Bangkok',
    line_id: '@hunterdev',
  };

  it('should validate correct site settings', () => {
    const result = siteSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it('should fail if site_name is missing', () => {
    const result = siteSettingsSchema.safeParse({ ...validSettings, site_name: '' });
    expect(result.success).toBe(false);
  });

  it('should fail if contact_email is invalid', () => {
    const result = siteSettingsSchema.safeParse({ ...validSettings, contact_email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('should validate URLs correctly', () => {
    const settingsWithUrl = {
      ...validSettings,
      facebook_url: 'https://facebook.com/hunterdev',
      line_url: 'https://line.me/ti/p/@hunterdev',
    };
    const result = siteSettingsSchema.safeParse(settingsWithUrl);
    expect(result.success).toBe(true);
  });

  it('should accept empty strings for optional URL fields', () => {
    const settingsWithEmptyUrl = {
      ...validSettings,
      facebook_url: '',
    };
    const result = siteSettingsSchema.safeParse(settingsWithEmptyUrl);
    expect(result.success).toBe(true);
  });
});
