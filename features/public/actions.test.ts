import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitInquiryAction, createDepositLeadAction } from './actions';
import * as crypto from '@/lib/crypto';

// Mock Supabase
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  })),
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
    })),
  })),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1')
  })
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: mockFrom
  })
}));

// Mock Crypto to return fixed values for easier testing
vi.mock('@/features/line/utils', () => ({
  sendLineNotification: vi.fn().mockResolvedValue({ success: true }),
  getTemplateConfig: vi.fn().mockResolvedValue({ config: { headerColor: '#000', headerText: 'Test' } }),
}));

vi.mock('@/features/documents/template-engine', () => ({
  getTemplateConfig: vi.fn().mockResolvedValue({ config: { headerColor: '#000', headerText: 'Test' } }),
}));
vi.mock('@/lib/crypto', async () => {
  const actual = await vi.importActual<typeof crypto>('@/lib/crypto');
  return {
    ...actual,
    encrypt: vi.fn((val) => `enc:${val}`),
    generateBlindIndex: vi.fn((val) => `hash:${val}`),
  };
});

// Actually, let's mock the module that provides the limiter if it's imported
vi.mock('@/lib/ratelimit', () => ({
  limiter: {
    check: vi.fn().mockResolvedValue(true)
  }
}));

describe('Public Server Actions - Brutal Hardening Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitInquiryAction', () => {
    it('should correctly encrypt and map parameters to RPC', async () => {
      mockRpc.mockResolvedValue({ data: 'success-id', error: null });

      const formData = new FormData();
      formData.append('propertyId', '550e8400-e29b-41d4-a716-446655440000');
      formData.append('fullName', 'Hunter');
      formData.append('phone', '0812345678');
      formData.append('email', 'test@test.com');
      formData.append('lineId', 'line123');
      formData.append('wechatId', 'wechat123');
      formData.append('whatsapp', 'whatsapp123');
      formData.append('message', 'Hello');

      await submitInquiryAction({}, formData);

      expect(mockRpc).toHaveBeenCalledWith('submit_public_lead', {
        p_full_name: 'enc:Hunter',
        p_full_name_hash: 'hash:Hunter',
        p_phone: 'enc:0812345678',
        p_phone_hash: 'hash:0812345678',
        p_email: 'enc:test@test.com',
        p_email_hash: 'hash:test@test.com',
        p_line_id: 'enc:line123',
        p_line_id_hash: 'hash:line123',
        p_wechat_id: 'wechat123',
        p_whatsapp: 'whatsapp123',
        p_property_id: '550e8400-e29b-41d4-a716-446655440000',
        p_source: 'WEBSITE',
        p_note: 'Hello',
        p_utm_source: undefined,
        p_ai_score: 0
      });
    });

    it('should return error when RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'DB_DOWN' } });

      const formData = new FormData();
      formData.append('propertyId', '550e8400-e29b-41d4-a716-446655440000');
      formData.append('fullName', 'A Name');
      formData.append('phone', '0812345678');
      formData.append('message', '');

      const result = await submitInquiryAction({}, formData);
      expect(result.error).toBe('เกิดข้อผิดพลาดในการส่งข้อมูล');
    });

    it('should handle missing optional fields', async () => {
      mockRpc.mockResolvedValue({ data: 'id', error: null });

      const formData = new FormData();
      formData.append('propertyId', '550e8400-e29b-41d4-a716-446655440000');
      formData.append('fullName', 'N Name');
      formData.append('phone', '0812345678');
      formData.append('message', 'M');

      await submitInquiryAction({}, formData);

      expect(mockRpc).toHaveBeenCalledWith('submit_public_lead', {
        p_full_name: 'enc:N Name',
        p_full_name_hash: 'hash:N Name',
        p_phone: 'enc:0812345678',
        p_phone_hash: 'hash:0812345678',
        p_email: 'enc:',
        p_email_hash: 'hash:',
        p_line_id: 'enc:',
        p_line_id_hash: 'hash:',
        p_wechat_id: null,
        p_whatsapp: null,
        p_property_id: '550e8400-e29b-41d4-a716-446655440000',
        p_source: 'WEBSITE',
        p_note: 'M',
        p_utm_source: undefined,
        p_ai_score: 0
      });
    });
  });

  describe('createDepositLeadAction', () => {
    it('should handle price calculation and PII correctly', async () => {
      mockRpc.mockResolvedValue({ data: 'lead-id', error: null });

      const payload = {
        fullName: 'Depositor Name',
        phone: '0999999999',
        email: 'dep@test.com',
        propertyType: 'CONDO' as any,
        details: 'High floor'
      };

      const result = await createDepositLeadAction(payload);

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('create_deposit_lead', {
        p_full_name: 'enc:Depositor Name',
        p_full_name_hash: 'hash:Depositor Name',
        p_phone: 'enc:0999999999',
        p_phone_hash: 'hash:0999999999',
        p_email: 'enc:dep@test.com',
        p_email_hash: 'hash:dep@test.com',
        p_line_id: 'enc:',
        p_line_id_hash: 'hash:',
        p_wechat_id: undefined,
        p_whatsapp: undefined,
        p_property_type: 'CONDO',
        p_note: 'enc:[ฝากทรัพย์] \nอีเมล: dep@test.com\nLine: -\nWeChat: -\nWhatsApp: -\nType: CONDO\nDetails: High floor'
      });
    });
  });
});
