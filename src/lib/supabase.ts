import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Auth and database features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export type XRayProfileDB = {
  id: string;
  user_id: string;
  sponsor_name: string;
  track_record: string;
  answers: Record<string, string>;
  is_public: boolean;
  share_token: string | null;
  share_expires_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type PreNupAnalysisDB = {
  id: string;
  user_id: string;
  partner_a_name: string;
  partner_b_name: string;
  partner_a_answers: Record<string, string>;
  partner_b_answers: Record<string, string>;
  analysis_results: any;
  overall_score: number | null;
  is_public: boolean;
  share_token: string | null;
  share_expires_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type UsageTracking = {
  id: string;
  user_id: string;
  resource_type: 'xray' | 'prenup' | 'ai_analysis';
  month_year: string;
  count: number;
  created_at: string;
};

export type SharedLink = {
  id: string;
  user_id: string;
  resource_type: 'xray' | 'prenup';
  resource_id: string;
  token: string;
  password_hash: string | null;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
};
