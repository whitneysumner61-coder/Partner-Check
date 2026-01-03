import { useState, useEffect } from 'react';
import { supabase, UsageTracking } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';

export type ResourceType = 'xray' | 'prenup' | 'ai_analysis';

export const useUsage = () => {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const [usage, setUsage] = useState<Record<ResourceType, number>>({
    xray: 0,
    prenup: 0,
    ai_analysis: 0,
  });
  const [loading, setLoading] = useState(true);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const fetchUsage = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const monthYear = getCurrentMonthYear();
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear);

      if (error) throw error;

      const usageMap: Record<ResourceType, number> = {
        xray: 0,
        prenup: 0,
        ai_analysis: 0,
      };

      data?.forEach((record: UsageTracking) => {
        usageMap[record.resource_type] = record.count;
      });

      setUsage(usageMap);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  const trackUsage = async (resourceType: ResourceType) => {
    if (!user) return false;

    const monthYear = getCurrentMonthYear();

    try {
      // Use upsert to increment or create
      const { error } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_resource_type: resourceType,
        p_month_year: monthYear,
      });

      if (error) {
        // Fallback if RPC doesn't exist - use manual upsert
        const { data: existing } = await supabase
          .from('usage_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('resource_type', resourceType)
          .eq('month_year', monthYear)
          .single();

        if (existing) {
          await supabase
            .from('usage_tracking')
            .update({ count: existing.count + 1 })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('usage_tracking')
            .insert({
              user_id: user.id,
              resource_type: resourceType,
              month_year: monthYear,
              count: 1,
            });
        }
      }

      // Refresh usage
      await fetchUsage();
      return true;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  };

  const canUseResource = (resourceType: 'xray' | 'prenup'): boolean => {
    const limitKey = resourceType === 'xray' ? 'xrayPerMonth' : 'prenupPerMonth';
    const limit = limits[limitKey];
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    return usage[resourceType] < limit;
  };

  const getRemainingUsage = (resourceType: 'xray' | 'prenup'): number | null => {
    const limitKey = resourceType === 'xray' ? 'xrayPerMonth' : 'prenupPerMonth';
    const limit = limits[limitKey];
    
    // -1 means unlimited
    if (limit === -1) return null;
    
    return Math.max(0, limit - usage[resourceType]);
  };

  return {
    usage,
    loading,
    trackUsage,
    canUseResource,
    getRemainingUsage,
    refreshUsage: fetchUsage,
  };
};
