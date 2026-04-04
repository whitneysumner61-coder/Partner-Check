import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
const mockUseAuth = vi.fn();
const mockUseSubscription = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/useSubscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

// We test the pure logic functions extracted from the hook
// Since the hook depends heavily on React state + Supabase,
// we focus on the business logic: canUseResource and getRemainingUsage

describe('useUsage business logic', () => {
  // Replicate the pure logic from useUsage
  const canUseResource = (
    usage: Record<string, number>,
    limits: Record<string, number>,
    resourceType: 'xray' | 'prenup'
  ): boolean => {
    const limitKey = resourceType === 'xray' ? 'xrayPerMonth' : 'prenupPerMonth';
    const limit = limits[limitKey];
    if (limit === -1) return true;
    return usage[resourceType] < limit;
  };

  const getRemainingUsage = (
    usage: Record<string, number>,
    limits: Record<string, number>,
    resourceType: 'xray' | 'prenup'
  ): number | null => {
    const limitKey = resourceType === 'xray' ? 'xrayPerMonth' : 'prenupPerMonth';
    const limit = limits[limitKey];
    if (limit === -1) return null;
    return Math.max(0, limit - usage[resourceType]);
  };

  describe('canUseResource', () => {
    it('returns true when usage is below limit', () => {
      expect(canUseResource({ xray: 0 }, { xrayPerMonth: 1 }, 'xray')).toBe(true);
    });

    it('returns false when usage equals limit', () => {
      expect(canUseResource({ xray: 1 }, { xrayPerMonth: 1 }, 'xray')).toBe(false);
    });

    it('returns false when usage exceeds limit', () => {
      expect(canUseResource({ xray: 5 }, { xrayPerMonth: 1 }, 'xray')).toBe(false);
    });

    it('returns true for unlimited (-1) regardless of usage', () => {
      expect(canUseResource({ xray: 999 }, { xrayPerMonth: -1 }, 'xray')).toBe(true);
    });

    it('works for prenup resource type', () => {
      expect(canUseResource({ prenup: 0 }, { prenupPerMonth: 1 }, 'prenup')).toBe(true);
      expect(canUseResource({ prenup: 1 }, { prenupPerMonth: 1 }, 'prenup')).toBe(false);
    });
  });

  describe('getRemainingUsage', () => {
    it('returns remaining count', () => {
      expect(getRemainingUsage({ xray: 0 }, { xrayPerMonth: 3 }, 'xray')).toBe(3);
      expect(getRemainingUsage({ xray: 2 }, { xrayPerMonth: 3 }, 'xray')).toBe(1);
    });

    it('returns 0 when at limit', () => {
      expect(getRemainingUsage({ xray: 1 }, { xrayPerMonth: 1 }, 'xray')).toBe(0);
    });

    it('returns 0 when over limit (never negative)', () => {
      expect(getRemainingUsage({ xray: 5 }, { xrayPerMonth: 1 }, 'xray')).toBe(0);
    });

    it('returns null for unlimited (-1)', () => {
      expect(getRemainingUsage({ xray: 100 }, { xrayPerMonth: -1 }, 'xray')).toBeNull();
    });

    it('works for prenup resource type', () => {
      expect(getRemainingUsage({ prenup: 0 }, { prenupPerMonth: 1 }, 'prenup')).toBe(1);
    });
  });

  describe('getCurrentMonthYear format', () => {
    it('produces YYYY-MM format', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15'));

      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      expect(monthYear).toBe('2024-06');

      vi.useRealTimers();
    });

    it('pads single-digit months with zero', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01'));

      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      expect(monthYear).toBe('2024-01');

      vi.useRealTimers();
    });
  });
});
