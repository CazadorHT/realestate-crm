import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitInquiryAction, createDepositLeadAction, clearDuplicateSubmissionCache } from './actions';
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
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDuplicateSubmissionCache();
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
        phone: '0898765432',
        email: 'dep@test.com',
        propertyType: 'CONDO' as any,
        details: 'High floor'
      };

      const result = await createDepositLeadAction(payload);

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('create_deposit_lead', {
        p_full_name: 'enc:Depositor Name',
        p_full_name_hash: 'hash:Depositor Name',
        p_phone: 'enc:0898765432',
        p_phone_hash: 'hash:0898765432',
        p_email: 'enc:dep@test.com',
        p_email_hash: 'hash:dep@test.com',
        p_line_id: 'enc:',
        p_line_id_hash: 'hash:',
        p_wechat_id: undefined,
        p_whatsapp: undefined,
        p_property_type: 'CONDO',
        p_note: 'enc:[ฝากทรัพย์] \nอีเมล: dep@test.com\nLine: -\nWeChat: -\nWhatsApp: -\nType: CONDO\nImage: -\nDetails: High floor'
      });
    });

    it('should reject dummy phone numbers like 0999999999 or 0123456789', async () => {
      const payload = {
        fullName: 'Dummy Phone User',
        phone: '0999999999',
        propertyType: 'CONDO' as any,
      };

      const result = await createDepositLeadAction(payload);
      expect(result.success).toBe(false);
      expect(result.message).toBe('ข้อมูลไม่ถูกต้อง');
    });

    it('should silently block bot submission via honeypot field', async () => {
      const payload = {
        fullName: 'Bot Spammer',
        phone: '0898765432',
        propertyType: 'CONDO' as any,
        website_hp: 'i-am-a-bot-value'
      };

      const result = await createDepositLeadAction(payload);
      expect(result.success).toBe(true);
      expect(result.leadId).toBe('hp_blocked');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should handle duplicate content hash intelligently (allow different propertyType or updated details)', async () => {
      mockRpc.mockResolvedValue({ data: 'lead-id-1', error: null });

      const condoPayload = {
        fullName: 'User A',
        phone: '0811111111',
        propertyType: 'CONDO' as any,
        details: 'Unit 101'
      };

      // First submit -> Allowed
      const res1 = await createDepositLeadAction(condoPayload);
      expect(res1.success).toBe(true);
      expect(res1.leadId).toBe('lead-id-1');

      // Exact same submit immediately -> Blocked as duplicate
      const res2 = await createDepositLeadAction(condoPayload);
      expect(res2.success).toBe(true);
      expect(res2.leadId).toBe('dup_acknowledged');

      // Submit DIFFERENT propertyType (HOUSE) -> ALLOWED immediately!
      mockRpc.mockResolvedValue({ data: 'lead-id-2', error: null });
      const housePayload = {
        fullName: 'User A',
        phone: '0811111111',
        propertyType: 'HOUSE' as any,
        details: 'Unit 101'
      };
      const res3 = await createDepositLeadAction(housePayload);
      expect(res3.success).toBe(true);
      expect(res3.leadId).toBe('lead-id-2');

      // Submit DIFFERENT details -> ALLOWED immediately!
      mockRpc.mockResolvedValue({ data: 'lead-id-3', error: null });
      const updatedDetailsPayload = {
        fullName: 'User A',
        phone: '0811111111',
        propertyType: 'CONDO' as any,
        details: 'Unit 102 - Updated info'
      };
      const res4 = await createDepositLeadAction(updatedDetailsPayload);
      expect(res4.success).toBe(true);
      expect(res4.leadId).toBe('lead-id-3');
    });
  });
});
