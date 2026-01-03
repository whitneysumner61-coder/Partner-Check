import { supabase, XRayProfileDB, PreNupAnalysisDB } from './supabase';
import { XRayProfile, PreNupData, AlignmentAnalysis } from '../types';
import { generateToken, calculateExpirationDate } from './utils';

/**
 * Database service for X-Ray and Pre-Nup operations
 */

// X-Ray Profile Operations
export const createXRayProfile = async (
  userId: string,
  data: XRayProfile,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<{ data: XRayProfileDB | null; error: any }> => {
  try {
    const shareToken = generateToken();
    const shareExpiration = tier === 'free' ? 7 : tier === 'pro' ? 30 : null;
    
    const expirationDate = shareExpiration ? calculateExpirationDate(shareExpiration) : null;
    
    const dbData = {
      user_id: userId,
      sponsor_name: data.sponsorName,
      track_record: data.trackRecord,
      answers: data.answers,
      share_token: shareToken,
      share_expires_at: expirationDate ? expirationDate.toISOString() : null,
    };

    const { data: result, error } = await supabase
      .from('xray_profiles')
      .insert(dbData)
      .select()
      .single();

    return { data: result, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserXRayProfiles = async (
  userId: string
): Promise<{ data: XRayProfileDB[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('xray_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const getXRayProfileById = async (
  id: string
): Promise<{ data: XRayProfileDB | null; error: any }> => {
  const { data, error } = await supabase
    .from('xray_profiles')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
};

export const getXRayProfileByShareToken = async (
  token: string
): Promise<{ data: XRayProfileDB | null; error: any }> => {
  const { data, error } = await supabase
    .from('xray_profiles')
    .select('*')
    .eq('share_token', token)
    .single();

  // Increment view count
  if (data && !error) {
    await supabase
      .from('xray_profiles')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id);
  }

  return { data, error };
};

export const deleteXRayProfile = async (
  id: string,
  userId: string
): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('xray_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return { error };
};

// Pre-Nup Analysis Operations
export const createPreNupAnalysis = async (
  userId: string,
  data: PreNupData,
  analysisResults: AlignmentAnalysis[],
  tier: 'free' | 'pro' | 'enterprise'
): Promise<{ data: PreNupAnalysisDB | null; error: any }> => {
  try {
    const shareToken = generateToken();
    const shareExpiration = tier === 'free' ? 7 : tier === 'pro' ? 30 : null;
    
    // Calculate overall score
    const totalScore = analysisResults.reduce((sum, result) => sum + result.score, 0);
    const overallScore = analysisResults.length > 0 ? totalScore / analysisResults.length : 0;

    const expirationDate = shareExpiration ? calculateExpirationDate(shareExpiration) : null;
    
    const dbData = {
      user_id: userId,
      partner_a_name: data.partnerA.name,
      partner_b_name: data.partnerB.name,
      partner_a_answers: data.partnerA.answers,
      partner_b_answers: data.partnerB.answers,
      analysis_results: analysisResults,
      overall_score: overallScore,
      share_token: shareToken,
      share_expires_at: expirationDate ? expirationDate.toISOString() : null,
    };

    const { data: result, error } = await supabase
      .from('prenup_analyses')
      .insert(dbData)
      .select()
      .single();

    return { data: result, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserPreNupAnalyses = async (
  userId: string
): Promise<{ data: PreNupAnalysisDB[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('prenup_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const getPreNupAnalysisById = async (
  id: string
): Promise<{ data: PreNupAnalysisDB | null; error: any }> => {
  const { data, error } = await supabase
    .from('prenup_analyses')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
};

export const getPreNupAnalysisByShareToken = async (
  token: string
): Promise<{ data: PreNupAnalysisDB | null; error: any }> => {
  const { data, error } = await supabase
    .from('prenup_analyses')
    .select('*')
    .eq('share_token', token)
    .single();

  // Increment view count
  if (data && !error) {
    await supabase
      .from('prenup_analyses')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id);
  }

  return { data, error };
};

export const deletePreNupAnalysis = async (
  id: string,
  userId: string
): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('prenup_analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return { error };
};
