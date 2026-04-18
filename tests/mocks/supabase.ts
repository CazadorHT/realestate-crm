import { vi } from "vitest";

/**
 * 🛠️ Standardized Supabase Mock Client (Hardened)
 * Supports method chaining and common database operations.
 */
export const createMockSupabase = () => {
  let tableMocks: Record<string, any[]> = {};
  
  // Create shared spies for verification
  const spies: any = {
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
    then: vi.fn(),
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
    rpc: spies.rpc.mockImplementation(() => mock),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ data: { path: "test.jpg" }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://test.com/img.jpg" } }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "http://signed.com/img.jpg" }, error: null }),
    },
    
    /**
     * 🏗️ Helper: Queue a response for a specific table
     */
    mockTableResult: (table: string, data: any, error: any = null) => {
      if (!tableMocks[table]) tableMocks[table] = [];
      tableMocks[table].push({ data, error });
      return mock;
    },

    /**
     * 🏗️ Helper: Simple Success Mock
     */
    mockSuccess: (data: any, count: number | null = null) => {
      if (!tableMocks["_global"]) tableMocks["_global"] = [];
      tableMocks["_global"].push({ data, error: null, count });
      return mock;
    },

    /**
     * 🏗️ Helper: Clear all queued results and reset spies
     */
    clear: () => {
      tableMocks = {};
      Object.keys(spies).forEach(key => {
        if (typeof spies[key].mockClear === 'function') {
           spies[key].mockClear();
        }
      });
      // Reset auth mock to default
      mock.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "test-user-id" } }, 
        error: null 
      });
      return mock;
    }
  };

  /**
   * Creates an object that mimics Supabase Query Builder
   */
  function createQueryBuilder(table: string) {
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
      
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),

      // Builder then delegates to global then logic
      then: (resolve: any) => {
        if (tableMocks[table] && tableMocks[table].length > 0) {
          return resolve(tableMocks[table].shift()!);
        }
        return spies.then(resolve);
      }
    };
    return builder;
  }

  // Global "then" logic for RPC or direct await
  spies.then.mockImplementation(function (resolve: any) {
    let result = { data: [], error: null };
    if (tableMocks["_global"] && tableMocks["_global"].length > 0) {
      result = tableMocks["_global"].shift()!;
    }
    return resolve(result);
  });

  return mock;
};

// Singleton instance for global setup
export const globalMockSupabase = createMockSupabase();
