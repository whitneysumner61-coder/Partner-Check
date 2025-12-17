import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { getUserXRayProfiles, getUserPreNupAnalyses } from '../lib/database';
import { XRayProfileDB, PreNupAnalysisDB } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { formatDateShort } from '../lib/utils';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, limits } = useSubscription();
  const [xrays, setXrays] = useState<XRayProfileDB[]>([]);
  const [prenups, setPrenups] = useState<PreNupAnalysisDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'xrays' | 'prenups'>('xrays');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [xrayResult, prenupResult] = await Promise.all([
        getUserXRayProfiles(user.id),
        getUserPreNupAnalyses(user.id)
      ]);

      if (xrayResult.data) setXrays(xrayResult.data);
      if (prenupResult.data) setPrenups(prenupResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">My Dashboard</h1>
          <p className="text-slate-600">View and manage your X-Rays and Pre-Nups</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 mb-1">Current Plan</div>
            <div className="text-3xl font-black text-primary uppercase">{tier}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 mb-1">X-Rays Created</div>
            <div className="text-3xl font-black text-slate-900">{xrays.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 mb-1">Pre-Nups Created</div>
            <div className="text-3xl font-black text-slate-900">{prenups.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('xrays')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'xrays'
                    ? 'bg-primary text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                X-Ray Profiles ({xrays.length})
              </button>
              <button
                onClick={() => setActiveTab('prenups')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'prenups'
                    ? 'bg-primary text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pre-Nup Analyses ({prenups.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'xrays' ? (
              <div className="space-y-4">
                {xrays.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-5xl mb-4">🩺</div>
                    <p className="text-lg mb-4">No X-Ray profiles yet</p>
                    <Button onClick={() => navigate('/app')}>
                      Create Your First X-Ray
                    </Button>
                  </div>
                ) : (
                  xrays.map((xray) => (
                    <div
                      key={xray.id}
                      className="border border-slate-200 rounded-lg p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">
                            {xray.sponsor_name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Created {formatDateShort(xray.created_at)}
                          </p>
                        </div>
                        <div className="text-sm text-slate-500">
                          {xray.view_count} views
                        </div>
                      </div>
                      
                      <p className="text-slate-600 mb-4 text-sm line-clamp-2">
                        {xray.track_record}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyShareLink(xray.share_token || '')}
                          disabled={!xray.share_token}
                        >
                          📋 Copy Link
                        </Button>
                        {limits.canExportPDF && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toast('PDF export coming soon!')}
                          >
                            📄 Export PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {prenups.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-5xl mb-4">🤝</div>
                    <p className="text-lg mb-4">No Pre-Nup analyses yet</p>
                    <Button onClick={() => navigate('/app')}>
                      Create Your First Pre-Nup
                    </Button>
                  </div>
                ) : (
                  prenups.map((prenup) => (
                    <div
                      key={prenup.id}
                      className="border border-slate-200 rounded-lg p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">
                            {prenup.partner_a_name} ↔ {prenup.partner_b_name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Created {formatDateShort(prenup.created_at)}
                          </p>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500 mb-1">Overall Score</div>
                          <div className={`text-2xl font-black ${
                            (prenup.overall_score || 0) >= 70 ? 'text-green-500' :
                            (prenup.overall_score || 0) >= 50 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {prenup.overall_score?.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-500 mb-4">
                        {prenup.view_count} views
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyShareLink(prenup.share_token || '')}
                          disabled={!prenup.share_token}
                        >
                          📋 Copy Link
                        </Button>
                        {limits.canExportPDF && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toast('PDF export coming soon!')}
                          >
                            📄 Export PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {tier === 'free' && (
          <div className="mt-8 bg-gradient-to-r from-primary to-blue-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to do more?</h3>
            <p className="mb-6 opacity-90">
              Upgrade to Pro for unlimited X-Rays, Pre-Nups, and PDF exports
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
