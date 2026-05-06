import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '@/tests/mocks/supabase';

// Create a FRESH instance for this file
const mockSupabase = createMockSupabase();

// 🛡️ HOISTED MOCK REGISTRY
const { mockRegistry } = vi.hoisted(() => ({
  mockRegistry: {
    user: { id: 'user-123', role: 'ADMIN', full_name: 'Admin User' },
    inngestError: new Error('Inngest unavailable in test'),
    aiResult: {
      title: 'AI Generated',
      content: 'AI Content',
      category: 'Real Estate',
      slug: 'ai-generated'
    },
    generateBlogPost: vi.fn(),
    requireAuthContext: vi.fn(),
    notifyAdminsAction: vi.fn(),
  }
}));

// Use a unique global key to avoid collision and ensure hoisting compatibility
(globalThis as any).__BLOG_ACTIONS_MOCK__ = mockSupabase;

// 🛡️ TOP-LEVEL MOCKS
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: () => ({ get: () => 'test-agent' }),
  cookies: () => ({ get: () => ({}) }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => (globalThis as any).__BLOG_ACTIONS_MOCK__),
}));

vi.mock('@/lib/supabase/getCurrentProfile', () => ({
  getCurrentProfile: async () => mockRegistry.user,
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockImplementation(async () => { throw mockRegistry.inngestError; }),
  },
}));

vi.mock('@/lib/authz', () => ({
  requireAuthContext: mockRegistry.requireAuthContext,
}));

vi.mock('./services/ai-service', () => ({
  generateBlogPost: mockRegistry.generateBlogPost,
  refineBlogContent: vi.fn(),
}));

vi.mock('./blog-utils', () => ({
  generateBlogSlug: (title: string) => title.toLowerCase().replace(/ /g, '-'),
  ensureUniqueSlug: (_: any, slug: string) => Promise.resolve(slug),
  generateBlogJsonLd: () => ({}),
}));

vi.mock('@/lib/i18n', () => ({
  getServerTranslations: async () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/actions/notifications', () => ({
  notifyAdminsAction: mockRegistry.notifyAdminsAction,
}));

describe('Blog Actions', () => {
  let createBlogPostAction: any;
  let generateBlogPostAction: any;
  let generateBlogPost: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSupabase.clear();
    
    // Ensure the mock is set in globalThis before actions are imported/called
    (globalThis as any).__BLOG_ACTIONS_MOCK__ = mockSupabase;

    // Setup registry defaults
    mockRegistry.requireAuthContext.mockResolvedValue({
      supabase: mockSupabase,
      user: mockRegistry.user,
      tenantId: 't1',
      role: mockRegistry.user.role,
    });
    mockRegistry.generateBlogPost.mockResolvedValue(mockRegistry.aiResult);
    mockRegistry.notifyAdminsAction.mockResolvedValue({ success: true });
    
    mockRegistry.user = { id: 'user-123', role: 'ADMIN', full_name: 'Admin User' };
    mockRegistry.inngestError = new Error('Inngest unavailable in test');

    // DYNAMIC IMPORT
    const actions = await import('./actions');
    createBlogPostAction = actions.createBlogPostAction;
    generateBlogPostAction = actions.generateBlogPostAction;
    
    const aiService = await import('./services/ai-service');
    generateBlogPost = aiService.generateBlogPost;
  });

  describe('createBlogPostAction', () => {
    it('should create a blog post successfully', async () => {
      mockSupabase.mockTableResult('blog_posts', { id: 'post-123', slug: 'test-blog' });

      const input = {
        title: 'Test Blog',
        slug: 'test-blog',
        category: 'Real Estate',
        content: '<p>Content</p>',
        is_published: true,
      };

      const result = await createBlogPostAction(input as any);
      
      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('generateBlogPostAction', () => {
    it('should call ai-service with correct parameters', async () => {
      mockSupabase.mockTableResult('blog_posts', [
        { title: 'Related 1', slug: 'related-1' }
      ]);

      const result = await generateBlogPostAction(
        'bangkok condo',
        'buyers',
        'friendly',
        'Short'
      );

      expect(generateBlogPost).toHaveBeenCalled();
      expect(result.data).toHaveProperty('title', 'AI Generated');
    });
  });
});
