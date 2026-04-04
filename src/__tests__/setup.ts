import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env for all tests
vi.stubGlobal('import', { meta: { env: {} } });

// Mock Supabase client globally
vi.mock('../lib/supabase', () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }));

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        signInWithOAuth: vi.fn(),
        signInWithOtp: vi.fn(),
      },
      rpc: vi.fn(),
    },
    Profile: {} as any,
    XRayProfileDB: {} as any,
    PreNupAnalysisDB: {} as any,
    UsageTracking: {} as any,
    SharedLink: {} as any,
  };
});
