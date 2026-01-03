import { useAuth } from '../contexts/AuthContext';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionLimits {
  xrayPerMonth: number;
  prenupPerMonth: number;
  canExportPDF: boolean;
  canShare: boolean;
  shareExpiration: number | null; // days, null = unlimited
  canUseAdvancedAnalytics: boolean;
  canWhiteLabel: boolean;
  teamSize: number;
  hasAPIAccess: boolean;
  watermarked: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    xrayPerMonth: 1,
    prenupPerMonth: 1,
    canExportPDF: false,
    canShare: true,
    shareExpiration: 7,
    canUseAdvancedAnalytics: false,
    canWhiteLabel: false,
    teamSize: 1,
    hasAPIAccess: false,
    watermarked: true,
  },
  pro: {
    xrayPerMonth: -1, // unlimited
    prenupPerMonth: -1,
    canExportPDF: true,
    canShare: true,
    shareExpiration: 30,
    canUseAdvancedAnalytics: true,
    canWhiteLabel: false,
    teamSize: 1,
    hasAPIAccess: false,
    watermarked: false,
  },
  enterprise: {
    xrayPerMonth: -1,
    prenupPerMonth: -1,
    canExportPDF: true,
    canShare: true,
    shareExpiration: null,
    canUseAdvancedAnalytics: true,
    canWhiteLabel: true,
    teamSize: 5,
    hasAPIAccess: true,
    watermarked: false,
  },
};

export const useSubscription = () => {
  const { profile } = useAuth();
  
  const tier: SubscriptionTier = profile?.subscription_tier || 'free';
  const limits = TIER_LIMITS[tier];

  const canUseFeature = (feature: keyof SubscriptionLimits): boolean => {
    return Boolean(limits[feature]);
  };

  const isFeatureAvailable = (feature: keyof SubscriptionLimits): boolean => {
    return Boolean(limits[feature]);
  };

  const needsUpgrade = (feature: keyof SubscriptionLimits): boolean => {
    return !isFeatureAvailable(feature);
  };

  return {
    tier,
    limits,
    canUseFeature,
    isFeatureAvailable,
    needsUpgrade,
    isPro: tier === 'pro',
    isEnterprise: tier === 'enterprise',
    isFree: tier === 'free',
  };
};
