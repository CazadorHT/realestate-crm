import { vi } from 'vitest';
import { globalMockSupabase as mockSupabaseClient } from './tests/mocks/supabase';

// 🛡️ Set global bridge for createClient()
(globalThis as any).__MOCK_SUPABASE__ = mockSupabaseClient;

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

// 3. Mock Next.js Cache & Headers
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// 4. Mock @supabase/supabase-js and @supabase/ssr to return our Singleton
vi.mock('@supabase/supabase-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return {
    ...actual,
    createClient: vi.fn(() => mockSupabaseClient),
  };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

// 5. Mock createAdminClient สำหรับ Storage Cleanup
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

// 6. Mock createClient (Server) System-Wide
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
}));
