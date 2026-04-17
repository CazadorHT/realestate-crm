import { vi } from 'vitest';

/**
 * 🛠️ Singleton Supabase Mock
 * This object is shared across all tests to ensure chained methods
 * works correctly and we can spy on them.
 */
export const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockReturnThis(),
  storage: {
    from: vi.fn().mockReturnThis(),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    copy: vi.fn().mockResolvedValue({ error: null }),
  },
};

// 1. Mock Inngest (ป้องกันการส่ง Event จริงไประหว่าง Test)
vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ['test-event-id'] }),
  },
}));

// 2. Mock Gemini AI
vi.mock('@/lib/ai/gemini', () => ({
  generateText: vi.fn(),
}));

// 3. Mock Next.js Cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// 4. Mock @supabase/supabase-js to return our Singleton
vi.mock('@supabase/supabase-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return {
    ...actual,
    createClient: vi.fn(() => mockSupabaseClient),
  };
});

// 5. Mock createAdminClient สำหรับ Storage Cleanup
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));
