import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAiAnalysisAction } from './actions';
import { analyzeDocumentAction } from './ai-actions';
import { requireAuthContext, assertStaff } from '@/lib/authz';

// 1. Mock the Auth Context
vi.mock('@/lib/authz', () => ({
  requireAuthContext: vi.fn(),
  assertStaff: vi.fn(),
}));

// 2. Mock Next.js Cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// 3. Mock AI Engine
vi.mock('@/lib/ai/gemini', () => ({
  generateText: vi.fn().mockResolvedValue({ 
    text: JSON.stringify({ 
      summary: 'Mocked AI summary content', 
      risks: ['Risk A'], 
      key_dates: [], 
      document_type_suggestion: 'OTHER' 
    }) 
  }),
}));

describe('AI Hallucination Mitigation Logic', () => {
  const mockDocumentId = 'doc-123';
  const mockUser = { id: 'user-admin' };
  const mockTenantId = 'tenant-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeDocumentAction (Hardening Test)', () => {
    it('should return AI findings without updating the database (Human-in-the-loop)', async () => {
      // Setup Mock Supabase
      const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({ 
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: mockDocumentId, file_name: 'test.pdf', storage_path: 's1' }, error: null }),
          update: mockUpdate 
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'http://signed.url' }, error: null })
          })
        }
      };

      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        tenantId: mockTenantId,
        role: 'ADMIN',
      });

      // Note: We are testing that even if this action is called, 
      // the NEW logic should NOT trigger mockUpdate for the document content.
      const result = await analyzeDocumentAction(mockDocumentId);

      // Verify that 'update' was NEVER called inside analyzeDocumentAction
      // because we moved persistence to the verification step.
      expect(mockUpdate).not.toHaveBeenCalled();
      
      // Verify that it still returns data for UI review
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data?.summary).toBeDefined();
      }
    });
  });

  describe('verifyAiAnalysisAction (Manual Confirmation Test)', () => {
    it('should save verified analysis with human signature', async () => {
      const mockUpdate = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }));
      
      const mockSupabase = {
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      };

      (requireAuthContext as any).mockResolvedValue({
        supabase: mockSupabase,
        user: mockUser,
        role: 'ADMIN',
      });

      const mockSummary = "Verified Summary content";
      const mockAnalysis: any = { summary: mockSummary, risks: ["Risk A"], key_dates: [] };

      const result = await verifyAiAnalysisAction(mockDocumentId, mockSummary, mockAnalysis);

      expect(result.success).toBe(true);
      
      // Verify that it actually calls Supabase now
      expect(mockSupabase.from).toHaveBeenCalledWith('documents_v3');
      
      // Verify that AI verification metadata is included
      const updatePayload = mockUpdate.mock.calls[0][0];
      expect(updatePayload).toMatchObject({
        ai_summary: JSON.stringify({
          summary: mockSummary,
          risks: ["Risk A"],
          key_dates: [],
        }),
        ai_verified_status: "VERIFIED",
      });
    });
  });
});
