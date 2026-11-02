import { describe, it, expect } from 'vitest';
import { siteSettingsSchema } from './schema';
import { buildLineUrl, buildWhatsAppUrl } from '@/lib/social-links';

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
      line_url_2: '',
      line_id_2: '',
      whatsapp_number: '',
      wechat_id: '',
    };
    const result = siteSettingsSchema.safeParse(settingsWithEmptyUrl);
    expect(result.success).toBe(true);
  });

  it('should validate dual LINE, WhatsApp, and WeChat fields', () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      line_label: 'LINE Official',
      line_id_2: 'vcc.direct',
      line_url_2: 'https://line.me/ti/p/~vcc.direct',
      line_label_2: 'LINE สำรอง',
      whatsapp_number: '081-234-5678',
      wechat_id: 'vcc_asset',
    });
    expect(result.success).toBe(true);
  });

  it('should format LINE and WhatsApp links accurately', () => {
    expect(buildLineUrl('', 'vcc.direct')).toBe('https://line.me/ti/p/~vcc.direct');
    expect(buildLineUrl('', '@vccasset')).toBe('https://line.me/R/ti/p/%40vccasset');
    expect(buildWhatsAppUrl('081-234-5678')).toBe('https://wa.me/66812345678');
    expect(buildWhatsAppUrl('+66899998888')).toBe('https://wa.me/66899998888');
  });
});
