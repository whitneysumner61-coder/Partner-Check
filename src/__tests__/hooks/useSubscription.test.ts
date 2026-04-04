import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// We need to mock useAuth before importing useSubscription
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useSubscription } from '../../hooks/useSubscription';

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('free tier', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: { subscription_tier: 'free' },
      });
    });

    it('returns free tier', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.tier).toBe('free');
      expect(result.current.isFree).toBe(true);
      expect(result.current.isPro).toBe(false);
      expect(result.current.isEnterprise).toBe(false);
    });

    it('has correct limits', () => {
      const { result } = renderHook(() => useSubscription());
      const { limits } = result.current;
      expect(limits.xrayPerMonth).toBe(1);
      expect(limits.prenupPerMonth).toBe(1);
      expect(limits.canExportPDF).toBe(false);
      expect(limits.shareExpiration).toBe(7);
      expect(limits.canUseAdvancedAnalytics).toBe(false);
      expect(limits.canWhiteLabel).toBe(false);
      expect(limits.teamSize).toBe(1);
      expect(limits.hasAPIAccess).toBe(false);
      expect(limits.watermarked).toBe(true);
    });

    it('canUseFeature returns false for premium features', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.canUseFeature('canExportPDF')).toBe(false);
      expect(result.current.canUseFeature('canUseAdvancedAnalytics')).toBe(false);
      expect(result.current.canUseFeature('hasAPIAccess')).toBe(false);
    });

    it('needsUpgrade returns true for premium features', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.needsUpgrade('canExportPDF')).toBe(true);
      expect(result.current.needsUpgrade('canUseAdvancedAnalytics')).toBe(true);
    });
  });

  describe('pro tier', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: { subscription_tier: 'pro' },
      });
    });

    it('returns pro tier', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.tier).toBe('pro');
      expect(result.current.isPro).toBe(true);
      expect(result.current.isFree).toBe(false);
    });

    it('has unlimited xray and prenup', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.limits.xrayPerMonth).toBe(-1);
      expect(result.current.limits.prenupPerMonth).toBe(-1);
    });

    it('can export PDF', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.canUseFeature('canExportPDF')).toBe(true);
    });

    it('has 30 day share expiration', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.limits.shareExpiration).toBe(30);
    });

    it('cannot white-label', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.needsUpgrade('canWhiteLabel')).toBe(true);
    });
  });

  describe('enterprise tier', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: { subscription_tier: 'enterprise' },
      });
    });

    it('returns enterprise tier', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.tier).toBe('enterprise');
      expect(result.current.isEnterprise).toBe(true);
    });

    it('has all premium features', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.canUseFeature('canExportPDF')).toBe(true);
      expect(result.current.canUseFeature('canUseAdvancedAnalytics')).toBe(true);
      expect(result.current.canUseFeature('canWhiteLabel')).toBe(true);
      expect(result.current.canUseFeature('hasAPIAccess')).toBe(true);
    });

    it('has null share expiration (unlimited)', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.limits.shareExpiration).toBeNull();
    });

    it('has team size of 5', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.limits.teamSize).toBe(5);
    });

    it('is not watermarked', () => {
      const { result } = renderHook(() => useSubscription());
      expect(result.current.limits.watermarked).toBe(false);
    });
  });

  describe('default tier', () => {
    it('defaults to free when profile is null', () => {
      mockUseAuth.mockReturnValue({ profile: null });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.tier).toBe('free');
      expect(result.current.isFree).toBe(true);
    });

    it('defaults to free when subscription_tier is undefined', () => {
      mockUseAuth.mockReturnValue({ profile: {} });
      const { result } = renderHook(() => useSubscription());
      expect(result.current.tier).toBe('free');
    });
  });
});
