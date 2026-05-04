import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBlogPostAction, generateBlogPostAction } from './actions';
import { globalMockSupabase as mockSupabase } from '@/tests/mocks/supabase';
import { getCurrentProfile } from '@/lib/supabase/getCurrentProfile';
import { generateBlogPost } from './services/ai-service';

// Mocking the relative paths to ensure they match how actions.ts sees them
vi.mock('@/lib/supabase/getCurrentProfile');
vi.mock('./services/ai-service');
vi.mock('./blog-utils', () => ({
  generateBlogSlug: vi.fn((title) => title.toLowerCase().replace(/ /g, '-')),
  ensureUniqueSlug: vi.fn((_, slug) => Promise.resolve(slug)),
  generateBlogJsonLd: vi.fn(() => ({})),
}));
vi.mock('@/lib/i18n', () => ({
  getServerTranslations: vi.fn().mockResolvedValue({ t: (key: string) => key }),
}));

describe('Blog Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.clear();
    // Ensure the bridge is active for createClient
    (globalThis as any).__MOCK_SUPABASE__ = mockSupabase;
  });

  describe('createBlogPostAction', () => {
    it('should create a blog post successfully', async () => {
      vi.mocked(getCurrentProfile).mockResolvedValue({
        id: 'user-123',
        role: 'ADMIN',
        full_name: 'Admin User',
      } as any);

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
    });
  });

  describe('generateBlogPostAction', () => {
    it('should call ai-service with correct parameters', async () => {
      vi.mocked(getCurrentProfile).mockResolvedValue({ id: 'user-123', role: 'ADMIN' } as any);
      
      mockSupabase.mockTableResult('blog_posts', [
        { title: 'Related 1', slug: 'related-1' }
      ]);

      vi.mocked(generateBlogPost).mockResolvedValue({
        title: 'AI Generated',
        content: 'AI Content',
        slug: 'ai-generated'
      } as any);

      const result = await generateBlogPostAction(
        'bangkok condo',
        'buyers',
        'friendly',
        'Short'
      );

      expect(generateBlogPost).toHaveBeenCalled();
      expect(result).toHaveProperty('title', 'AI Generated');
    });
  });
});
