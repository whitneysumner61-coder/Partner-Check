-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- X-Ray Profiles
CREATE TABLE IF NOT EXISTS xray_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sponsor_name TEXT NOT NULL,
  track_record TEXT,
  answers JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-Nup Analyses
CREATE TABLE IF NOT EXISTS prenup_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_a_name TEXT NOT NULL,
  partner_b_name TEXT NOT NULL,
  partner_a_answers JSONB NOT NULL,
  partner_b_answers JSONB NOT NULL,
  analysis_results JSONB NOT NULL,
  overall_score NUMERIC(5,2),
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('xray', 'prenup', 'ai_analysis')),
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_type, month_year)
);

-- Shared Links
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('xray', 'prenup')),
  resource_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_xray_user ON xray_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_xray_share ON xray_profiles(share_token);
CREATE INDEX IF NOT EXISTS idx_prenup_user ON prenup_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_prenup_share ON prenup_analyses(share_token);
CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage_tracking(user_id, month_year);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE xray_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenup_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own xrays" ON xray_profiles;
DROP POLICY IF EXISTS "Users can create own xrays" ON xray_profiles;
DROP POLICY IF EXISTS "Users can update own xrays" ON xray_profiles;
DROP POLICY IF EXISTS "Users can delete own xrays" ON xray_profiles;
DROP POLICY IF EXISTS "Users can view own prenups" ON prenup_analyses;
DROP POLICY IF EXISTS "Users can create own prenups" ON prenup_analyses;
DROP POLICY IF EXISTS "Users can update own prenups" ON prenup_analyses;
DROP POLICY IF EXISTS "Users can delete own prenups" ON prenup_analyses;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own xrays" ON xray_profiles FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create own xrays" ON xray_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xrays" ON xray_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own xrays" ON xray_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own prenups" ON prenup_analyses FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create own prenups" ON prenup_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prenups" ON prenup_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prenups" ON prenup_analyses FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
