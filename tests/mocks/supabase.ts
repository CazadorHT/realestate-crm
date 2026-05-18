import { vi } from "vitest";

export const createMockSupabase = () => {
  const tableMocks: Record<string, any[]> = {};

  // Shared spies for tracking calls across client and builder
  const spies = {
    from: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    single: vi.fn(),
    rpc: vi.fn(),
    range: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    in: vi.fn(),
    not: vi.fn(),
  };

  const createQueryBuilder = (table: string) => {
    const builder: any = {
      select: spies.select.mockReturnThis(),
      update: spies.update.mockReturnThis(),
      insert: spies.insert.mockReturnThis(),
      delete: spies.delete.mockReturnThis(),
      upsert: spies.upsert.mockReturnThis(),
      eq: spies.eq.mockReturnThis(),
      neq: spies.neq.mockReturnThis(),
      single: spies.single.mockReturnThis(),
      range: spies.range.mockReturnThis(),
      order: spies.order.mockReturnThis(),
      limit: spies.limit.mockReturnThis(),
      maybeSingle: spies.maybeSingle.mockReturnThis(),
      in: spies.in.mockReturnThis(),
      not: spies.not.mockReturnThis(),
      
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),

      // Builder THEN implementation
      then: (resolve: any) => {
        let result = { data: [], error: null, count: undefined };
        if (tableMocks[table] && tableMocks[table].length > 0) {
          result = tableMocks[table].shift()!;
        } else if (tableMocks["_global"] && tableMocks["_global"].length > 0) {
          result = tableMocks["_global"].shift()!;
        }
        return Promise.resolve(result).then(resolve);
      }
    };
    return builder;
  };

  const mock: any = {
    ...spies,
    // Add auth property with default mock to prevent "undefined" errors
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: "test-user-id" } }, 
        error: null 
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: spies.from.mockImplementation((table: string) => {
      return createQueryBuilder(table);
    }),
    rpc: spies.rpc.mockImplementation(() => createQueryBuilder("_rpc")),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ data: { path: "test.jpg" }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "http://signed.com/img.jpg" }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://public.com/img.jpg" } }),
    },
    mockTableResult: (table: string, data: any, count?: number) => {
      tableMocks[table] = tableMocks[table] || [];
      tableMocks[table].push({ data, count, error: null } as any);
      return mock; // 🛡️ Enable Chaining
    },
    mockTableError: (table: string, error: any) => {
      tableMocks[table] = tableMocks[table] || [];
      tableMocks[table].push({ data: null, count: undefined, error } as any);
      return mock; // 🛡️ Enable Chaining
    },
    mockSuccess: (data: any) => {
      tableMocks["_global"] = tableMocks["_global"] || [];
      tableMocks["_global"].push({ data, error: null } as any);
      return mock; // 🛡️ Enable Chaining
    },
    clear: () => {
      Object.keys(tableMocks).forEach((key) => delete tableMocks[key]);
      // Reset all shared spies
      Object.values(spies).forEach(spy => spy.mockClear());
      vi.clearAllMocks();
    },
  };

  return mock;
};

// Singleton instance for global setup
export const globalMockSupabase = createMockSupabase();
